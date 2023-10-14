import json
import os
import uuid

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

client = MongoClient(os.getenv('MONGODB_URL'))
flights = client.get_database('flights')
airlines = flights.get_collection("airlines")
alliances = flights.get_collection('alliances')
alliance_members = flights.get_collection('alliance_members')

alliances_file_json = open('alliances.json')
alliances_json = json.load(alliances_file_json)
alliances_documents = []
airlines_in_alliances = []
alliances_dict = {}
for alliance in alliances_json:
    id = str(uuid.uuid4())
    alliance_document = {
        "_id": id,
        "name": alliance["name"]
    }
    alliances_dict[id] = alliance
    alliances_documents.append(alliance_document)
    for airline in alliance['airlines']:
        airline_json = airlines.find_one({ 'iata': airline })
        airlines_in_alliances.append({ "_id": str(uuid.uuid4()), "airline": airline_json["_id"], "alliance": id })

alliances.insert_many(alliances_documents)
alliance_members.insert_many(airlines_in_alliances)

