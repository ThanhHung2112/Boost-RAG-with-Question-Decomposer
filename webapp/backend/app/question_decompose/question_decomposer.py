

from transformers import T5ForConditionalGeneration, T5Tokenizer
from typing import List, Optional
import logging
from pathlib import Path
import torch

class QuestionDecomposer:
    """A class to load and use the trained question decomposition model."""

    def __init__(
        self,
        model_path: str = "./models/question_decomposer",
        device: Optional[str] = None
    ):
        """
        Initialize the QuestionDecomposer with a trained model.

        Args:
            model_path: Path to the saved model directory
            device: Specific device to use ('cuda', 'mps', 'cpu'). If None, best available device will be used.
        """
        self.logger = logging.getLogger(__name__)
        self.model_path = Path(model_path)

        # Setup logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )

        # Set device
        self.device = self._get_device(device)
        self.logger.info(f"Using device: {self.device}")

        # Load model and tokenizer
        self._load_model()

    def _get_device(self, requested_device: Optional[str] = None) -> torch.device:
        """
        Get the appropriate device based on availability and preference.

        Args:
            requested_device: Specific device requested by user

        Returns:
            torch.device: The selected device
        """
        if requested_device:
            return torch.device(requested_device)

        if torch.backends.mps.is_available():
            return torch.device("mps")
        elif torch.cuda.is_available():
            return torch.device("cuda")
        return torch.device("cpu")

    def _load_model(self) -> None:
        """Load the model and tokenizer from the saved path."""
        try:
            self.logger.info(f"Loading model from {self.model_path}")

            # Check if model path exists
            if not self.model_path.exists():
                raise FileNotFoundError(
                    f"Model path {self.model_path} does not exist. "
                    "Please train the model first."
                )

            # Load tokenizer and model
            self.tokenizer = T5Tokenizer.from_pretrained(self.model_path)
            self.model = T5ForConditionalGeneration.from_pretrained(self.model_path)
            self.model.to(self.device)
            self.model.eval()

            self.logger.info("Model loaded successfully")

        except Exception as e:
            self.logger.error(f"Error loading model: {str(e)}")
            raise

    def decompose_question(
        self,
        question: str,
        max_length: int = 128,
        num_beams: int = 4
    ) -> List[str]:
        """
        Decompose a complex question into simpler sub-questions.

        Args:
            question: The complex question to decompose
            max_length: Maximum length of generated sequence
            num_beams: Number of beams for beam search

        Returns:
            List of generated sub-questions
        """
        try:
            # Prepare input
            input_text = f"decompose question: {question}"
            input_ids = self.tokenizer(
                input_text,
                max_length=max_length,
                padding="max_length",
                truncation=True,
                return_tensors="pt"
            ).input_ids.to(self.device)

            # Generate sub-questions
            with torch.no_grad():
                outputs = self.model.generate(
                    input_ids,
                    max_length=max_length,
                    num_beams=num_beams,
                    early_stopping=True
                )

            # Decode output
            decoded_output = self.tokenizer.decode(
                outputs[0],
                skip_special_tokens=True
            )
            sub_questions = decoded_output.split(" [SEP] ")

            # Clear cache if using MPS
            if self.device.type == "mps":
                torch.mps.empty_cache()

            return sub_questions

        except Exception as e:
            self.logger.error(f"Error during question decomposition: {str(e)}")
            raise

    def __call__(self, question: str) -> List[str]:
        """
        Callable interface for the QuestionDecomposer.

        Args:
            question: The question to decompose

        Returns:
            List of sub-questions
        """
        return self.decompose_question(question)