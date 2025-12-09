import os
import openai
from dotenv import load_dotenv

from llama_index.core import(
    VectorStoreIndex,
    SimpleDirectoryReader,
    StorageContext,
    load_index_from_storage
)

from llama_index.core.prompts import PromptTemplate
from llama_index.llms import OpenAI
from llama_index.llms.ollama import Ollama

# Script de preparation RAG : gere la creation/lecture de l'index et la configuration du prompt.
load_dotenv()

# Define personalized promt 
text_qa_template_str = (
    "Les informations contextuelles ci-dessous proviennent des documents .\n"
    "----------------------\n"
    "{context_str}\n"
    "----------------------\n"
    '''
    En utilisant UNIQUEMENT les informations contextuelles ci dessus sans utiliser de connaissances antérieurs, répondez a la question suivante de manière détaillée.\n
    NE FAITES PAS de distinctions entre majuscules et minuscules .\n
    Il peut y avoir les erreurs de frappes dans la question.\n
    Repond dans la meme langue que la question.\n
    Si vous ne trouvez pas la réponse dans les informations fourni, dites simplement :
    Je ne trouve pas cette information dans les docments fournis.\n
    Ne tentez PAS d inventer une réponse.\n 
    '''
    "Question: {query_str}\n"
    "Réponse: "
)

text_qa_template = PromptTemplate(text_qa_template_str)

# Definir le repertoire ou les indices seront persistés
PERSIST_DIR = "./storage"

# Verifier si le stockage existe 
if not os.path.exists(PERSIST_DIR):
    # Si le repertoire n'existe pas, créer les indices pour la premiere fois
    print("Creation des indices a partir des documents ...")
    # Charger tout les documents du dossier "data"
    try:
        documents = SimpleDirectoryReader("data").load_data()
        # Créer l'index vectoriel a partir des documents chargés
        # Cet index transforme les documents en vecteurs pour une recherche semantique
        index = VectorStoreIndex.from_documents(documents, verbose=True)
        # Sauvegarder l'index dans le dossier de persistance pour une utilisation ultérieure
        index.storage_context.persist(persist_dir=PERSIST_DIR)
        print(f"Index créé et sauvegardé dans le répertoire de persistance : {PERSIST_DIR}")

    except Exception as e:
        print(f"Erreur lors du Parsing : {e}")

else:
    # Si le repertoire existe deja, charger le repertoire de persistance 
    print("Chargement des indices depuis le stockage persistant ...")
    storage_context = StorageContext.from_defaults(persist_dir=PERSIST_DIR)
    #Charger l'index a partir du contexte de stockage
    index = load_index_from_storage(storage_context)
    print("Vector Store d'indices chargé avec succes!")

# Configuration du LLM OpenAI utilisé pour répondre aux questions.
openai_llm = OpenAI(
    model="gpt-40-mini",
    temperature=0.1,
    max_tokens=2000
)

# Creation du moteur de requetes avec prompt personnalisé
query_engine = index.as_query_engine(
    text_qa_template=text_qa_template, # Utilisation du prompt personnalisé
     similarity_top_k=5,# Nombre de documents similaires a recuperer pour chaque requete
    llm=openai_llm
)


    
