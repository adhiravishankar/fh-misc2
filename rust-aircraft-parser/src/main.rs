use std::{env, fs};
use std::ops::Deref;
use dotenv::dotenv;
use serde::{Deserialize, Serialize};
use mongodb::{bson, bson::doc, Client, Collection};
use mongodb::bson::Document;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug)]
struct Aircraft {
    icaoCode: String,
    iataCode: String,
    description: String,
}

fn read_aircraft_json() -> Vec<Aircraft> {
    let aircraft_string = fs::read_to_string("aircraft.json").expect("TODO: cannot unwrap string");

    // Parse the string of data into a Person object. This is exactly the
    // same function as the one that produced serde_json::Value above, but
    // now we are asking it for a Person as output.
    let aircrafts: Vec<Aircraft> = serde_json::from_str::<Vec<Aircraft>>(&*aircraft_string).expect("cannot parse json");

    return aircrafts;
}

async fn create_mongodb() -> mongodb::Collection<Document> {
    // Replace the placeholder with your Atlas connection string
    let uri = env::var("MONGODB_URL").expect("cannot get env var MONGODB_URL");
    // Create a new client and connect to the server
    let client = Client::with_uri_str(uri).await.expect("cannot create mongo client");
    // Get a handle on the movies collection
    let database = client.database("flights");
    let aircraft_collection = database.collection::<Document>("aircraft");
    return aircraft_collection
}

#[tokio::main]
async fn main() {
    dotenv().ok();
    let aircraft_collection: Collection<Document> = create_mongodb().await;
    let aircrafts: Vec<Aircraft> = read_aircraft_json();
    let mut aircraft_documents: Vec<Document> = Vec::new();
    for aircraft in aircrafts.iter() {
        // Convert `captain_marvel` to a Bson instance:
        let aircraft_bson = bson::to_bson(&aircraft).expect("unwrap bson");
        let mut document: Document = aircraft_bson.as_document().unwrap().clone();
        document.insert("_id", Uuid::new_v4().to_string());
        aircraft_documents.push(document);
    }
    aircraft_collection.insert_many(aircraft_documents, None).await.expect("insert into mongodb");
}
