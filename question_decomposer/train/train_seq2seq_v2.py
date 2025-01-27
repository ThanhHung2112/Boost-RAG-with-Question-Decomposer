import json
import torch
from torch.utils.data import Dataset, DataLoader
from transformers import (
    T5ForConditionalGeneration,
    T5Tokenizer,
    get_linear_schedule_with_warmup,
)
from typing import List, Dict
import numpy as np
from rouge_score import rouge_scorer
from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction
import time
from tqdm import tqdm
from functools import lru_cache


def get_device():
    """Get the appropriate device with MPS priority."""
    if torch.backends.mps.is_available():
        return torch.device("mps")
    elif torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


@lru_cache(maxsize=1)
def get_scorer():
    """Cached initialization of rouge scorer to avoid repeated instantiation."""
    return rouge_scorer.RougeScorer(
        ["rouge1", "rouge2", "rougeL", "rougeLsum"], use_stemmer=True
    )


class QuestionDecompositionDataset(Dataset):
    def __init__(
        self,
        data: List[Dict],
        tokenizer: T5Tokenizer,
        max_source_length: int = 128,
        max_target_length: int = 128,
    ):
        self.data = data
        self.tokenizer = tokenizer
        self.max_source_length = max_source_length
        self.max_target_length = max_target_length

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        item = self.data[idx]
        question = item["question"]
        sub_questions = " [SEP] ".join(item["sub-question"])

        source = f"decompose question: {question}"
        target = sub_questions

        source_encoding = self.tokenizer(
            source,
            max_length=self.max_source_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )

        target_encoding = self.tokenizer(
            target,
            max_length=self.max_target_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )

        return {
            "input_ids": source_encoding["input_ids"].squeeze(),
            "attention_mask": source_encoding["attention_mask"].squeeze(),
            "labels": target_encoding["input_ids"].squeeze(),
        }


def evaluate_batch_optimized(
    predictions, targets, tokenizer, scorer, smoothing_function, batch_size
):
    """Optimized batch evaluation using vectorized operations where possible."""
    # Decode all predictions and targets at once
    pred_texts = tokenizer.batch_decode(predictions, skip_special_tokens=True)
    target_texts = tokenizer.batch_decode(targets, skip_special_tokens=True)

    # Pre-allocate lists for scores
    rouge_scores = []
    bleu_scores = np.zeros(batch_size)

    # Process in smaller chunks for ROUGE (which is more memory-intensive)
    chunk_size = 16  # Adjust based on your memory constraints
    for i in range(0, len(pred_texts), chunk_size):
        chunk_preds = pred_texts[i : i + chunk_size]
        chunk_targets = target_texts[i : i + chunk_size]

        # Calculate ROUGE scores for the chunk
        chunk_rouge_scores = [
            scorer.score(target, pred)
            for target, pred in zip(chunk_targets, chunk_preds)
        ]
        rouge_scores.extend(chunk_rouge_scores)

        # Calculate BLEU scores for the chunk
        for j, (pred, target) in enumerate(zip(chunk_preds, chunk_targets)):
            pred_tokens = pred.split()
            target_tokens = target.split()
            bleu_scores[i + j] = sentence_bleu(
                [target_tokens],
                pred_tokens,
                smoothing_function=smoothing_function.method1,
            )

    return rouge_scores, bleu_scores.tolist()


def train_model(
    train_data: List[Dict],
    num_epochs: int = 3,
    batch_size: int = 4,
    eval_steps: int = 250,
):
    device = get_device()
    print(f"Using device: {device}")

    # Initialize tokenizer, model, and scorer (cached)
    tokenizer = T5Tokenizer.from_pretrained("t5-small")
    model = T5ForConditionalGeneration.from_pretrained("t5-small")
    scorer = get_scorer()

    # Prepare dataset and dataloader with larger eval batch size
    dataset = QuestionDecompositionDataset(train_data, tokenizer)
    train_size = int(0.9 * len(dataset))
    eval_size = len(dataset) - train_size
    train_dataset, eval_dataset = torch.utils.data.random_split(
        dataset, [train_size, eval_size]
    )

    train_dataloader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    eval_dataloader = DataLoader(
        eval_dataset, batch_size=batch_size * 2, shuffle=False
    )  # Larger batch size for eval

    try:
        model.to(device)
        optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4)
        scheduler = get_linear_schedule_with_warmup(
            optimizer,
            num_warmup_steps=0,
            num_training_steps=len(train_dataloader) * num_epochs,
        )

        smoothing_function = SmoothingFunction()
        train_metrics = {
            "loss_steps": [],
            "epoch_metrics": [],
            "train_time": 0,
            "epochs_completed": 0,
        }

        start_time = time.time()
        global_step = 0

        for epoch in range(num_epochs):
            model.train()
            epoch_loss = 0
            step_loss = 0

            # Training loop remains mostly unchanged...
            progress_bar = tqdm(
                train_dataloader, desc=f"Epoch {epoch + 1}/{num_epochs}"
            )

            for batch_idx, batch in enumerate(progress_bar):
                try:
                    input_ids = batch["input_ids"].to(device)
                    attention_mask = batch["attention_mask"].to(device)
                    labels = batch["labels"].to(device)

                    outputs = model(
                        input_ids=input_ids,
                        attention_mask=attention_mask,
                        labels=labels,
                    )

                    loss = outputs.loss
                    epoch_loss += loss.item()
                    step_loss += loss.item()

                    loss.backward()
                    torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
                    optimizer.step()
                    scheduler.step()
                    optimizer.zero_grad()

                    progress_bar.set_postfix({"loss": f"{loss.item():.4f}"})
                    global_step += 1

                    if global_step % eval_steps == 0:
                        average_step_loss = step_loss / eval_steps
                        train_metrics["loss_steps"].append(
                            {
                                "step": global_step,
                                "epoch": epoch + 1,
                                "loss": average_step_loss,
                            }
                        )
                        step_loss = 0

                        with open("training_metrics.json", "w") as f:
                            json.dump(train_metrics, f, indent=2)

                    if device.type == "mps":
                        torch.mps.empty_cache()

                except RuntimeError as e:
                    print(f"Batch error: {str(e)}")
                    continue

            # Optimized evaluation at epoch end
            model.eval()
            eval_rouge_scores = []
            eval_bleu_scores = []

            print("\nRunning evaluation...")
            eval_progress = tqdm(eval_dataloader, desc="Evaluating")

            with torch.no_grad():
                for eval_batch in eval_progress:
                    current_batch_size = eval_batch["input_ids"].size(0)
                    eval_input_ids = eval_batch["input_ids"].to(device)
                    eval_attention_mask = eval_batch["attention_mask"].to(device)
                    eval_labels = eval_batch["labels"].to(device)

                    eval_outputs = model.generate(
                        eval_input_ids,
                        max_length=dataset.max_target_length,
                        num_beams=4,
                        early_stopping=True,
                    )

                    batch_rouge_scores, batch_bleu_scores = evaluate_batch_optimized(
                        eval_outputs,
                        eval_labels,
                        tokenizer,
                        scorer,
                        smoothing_function,
                        current_batch_size,
                    )

                    eval_rouge_scores.extend(batch_rouge_scores)
                    eval_bleu_scores.extend(batch_bleu_scores)

                    if device.type == "mps":
                        torch.mps.empty_cache()

            # Calculate and save epoch metrics
            epoch_metrics = {
                "epoch": epoch + 1,
                "average_loss": epoch_loss / len(train_dataloader),
                "rouge1": np.mean([s["rouge1"].fmeasure for s in eval_rouge_scores]),
                "rouge2": np.mean([s["rouge2"].fmeasure for s in eval_rouge_scores]),
                "rougeL": np.mean([s["rougeL"].fmeasure for s in eval_rouge_scores]),
                "rougeLsum": np.mean(
                    [s["rougeLsum"].fmeasure for s in eval_rouge_scores]
                ),
                "bleu": np.mean(eval_bleu_scores),
                "time": time.time() - start_time,
            }

            train_metrics["epoch_metrics"].append(epoch_metrics)
            train_metrics["epochs_completed"] = epoch + 1
            train_metrics["train_time"] = time.time() - start_time

            # Save metrics and model checkpoint
            with open("training_metrics.json", "w") as f:
                json.dump(train_metrics, f, indent=2)

            checkpoint_dir = f"question_decomposition_model_epoch_{epoch + 1}"
            model.save_pretrained(checkpoint_dir)
            tokenizer.save_pretrained(checkpoint_dir)

            print(f"\nEpoch {epoch + 1}/{num_epochs}")
            print(f"Average Loss: {epoch_metrics['average_loss']:.4f}")
            print(f"ROUGE-1: {epoch_metrics['rouge1']:.4f}")
            print(f"BLEU: {epoch_metrics['bleu']:.4f}")

        # Save final model
        model.save_pretrained("question_decomposition_model_final")
        tokenizer.save_pretrained("question_decomposition_model_final")
        print("Final model saved successfully")

        return model, tokenizer, train_metrics

    except Exception as e:
        print(f"Error during training: {str(e)}")
        raise


def generate_sub_questions(
    model: T5ForConditionalGeneration,
    tokenizer: T5Tokenizer,
    question: str,
    max_length: int = 128,
) -> List[str]:
    device = get_device()

    try:
        model.to(device)
        model.eval()

        input_text = f"decompose question: {question}"
        input_ids = tokenizer(
            input_text,
            max_length=max_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        ).input_ids.to(device)

        with torch.no_grad():
            outputs = model.generate(
                input_ids, max_length=max_length, num_beams=4, early_stopping=True
            )

        decoded_output = tokenizer.decode(outputs[0], skip_special_tokens=True)
        sub_questions = decoded_output.split(" [SEP] ")

        if device.type == "mps":
            torch.mps.empty_cache()

        return sub_questions

    except Exception as e:
        print(f"Error during generation: {str(e)}")
        raise


if __name__ == "__main__":
    try:
        # Load training data
        with open("./train_data_main.json", "r") as f:
            train_data = json.load(f)

        # Train model
        model, tokenizer, train_metrics = train_model(
            train_data, num_epochs=3, batch_size=16, eval_steps=300
        )

        # Example generation
        test_question = "What is the capital of France and when was it established?"
        sub_questions = generate_sub_questions(model, tokenizer, test_question)
        print(f"\nOriginal question: {test_question}")
        print("Generated sub-questions:")
        for i, sq in enumerate(sub_questions, 1):
            print(f"{i}. {sq}")

    except Exception as e:
        print(f"Error in main execution: {str(e)}")
