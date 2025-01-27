try:
        # Initialize decomposer
        decomposer = QuestionDecomposer()

        # Example questions
        questions = [
            "What is the capital of France and when was it established?",
            "Who wrote Romeo and Juliet and what are its main themes?",
            "How does photosynthesis work and why is it important for life on Earth?",
            "Which year did Google, Facebook, and Twitter start and who were the founders? What are the main differences between them?"

        ]

        # Process each question
        for question in questions:
            print(f"\nOriginal question: {question}")
            print("Sub-questions:")
            sub_questions = decomposer(question)
            for i, sq in enumerate(sub_questions, 1):
                print(f"{i}. {sq}")

except Exception as e:
        logging.error(f"Error in main execution: {str(e)}")
        raise