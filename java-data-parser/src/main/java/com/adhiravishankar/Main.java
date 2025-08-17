package com.adhiravishankar;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.*;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import io.github.cdimascio.dotenv.Dotenv;
import org.bson.Document;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class Main {
    public static void main(String[] args) throws IOException {
        Dotenv dotenv = Dotenv.load();


        ObjectMapper mapper = new ObjectMapper();
        insertAirports(dotenv, mapper);
    }

    public static void insertAirports(Dotenv dotenv, ObjectMapper mapper) throws IOException {
        Airport[] airportsList = mapper.readValue(new File("airport-codes_json_filtered.json"), Airport[].class);

        ServerApi serverApi = ServerApi.builder().version(ServerApiVersion.V1).build();
        MongoClientSettings settings = MongoClientSettings.builder()
                .applyConnectionString(new ConnectionString(dotenv.get("MONGODB_URI"))).serverApi(serverApi).build();
        // Create a new client and connect to the server
        try (MongoClient mongoClient = MongoClients.create(settings)) {
            try {
                // Send a ping to confirm a successful connection
                MongoDatabase database = mongoClient.getDatabase("flights-admin");
                MongoCollection<Document> airportsCollection = database.getCollection("airports");
                List<Document> airportsDocuments = new ArrayList<>();
                for (Airport airport : airportsList) {
                    airportsDocuments.add(Document.parse(mapper.writeValueAsString(airport)).append("_id", UUID.randomUUID().toString()));
                }
                airportsCollection.insertMany(airportsDocuments);
            } catch (MongoException e) {
                e.printStackTrace();
            }
        }
    }
}
