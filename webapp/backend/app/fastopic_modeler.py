from rag.topic_model.FAST import FASTopicModel

fastopic_modeler = None

def init_fastopic_modeler():
    global fastopic_modeler
    fastopic_modeler = FASTopicModel(
        neo4j_uri="neo4j://localhost:7687",
        neo4j_user="neo4j",
        neo4j_password="12qwaszx"
    )