package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	mongoOptions "go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	loadDotEnv()
	ctx := context.TODO()
	mongoDB := connectToMongo(ctx)
	aircrafts := getAircrafts(ctx, mongoDB)
	manufacturers := loadManufacturers()
	addManufacturer(ctx, mongoDB, aircrafts, manufacturers)
}

func loadDotEnv() {
	err := godotenv.Load(".env")
	if err != nil {
		fmt.Println(err)
	}
}

func connectToMongo(ctx context.Context) *mongo.Database {
	apiOptions := mongoOptions.ServerAPI(mongoOptions.ServerAPIVersion1)
	clientOptions := mongoOptions.Client().ApplyURI(os.Getenv("MONGODB_URL")).SetServerAPIOptions(apiOptions)
	ctxTimeout, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	client, err := mongo.Connect(ctxTimeout, clientOptions)
	if err != nil {
		log.Fatal(err)
	}

	return client.Database(os.Getenv("MONGO_DB"))
}

func getAircrafts(ctx context.Context, db *mongo.Database) []Aircraft {
	cursor, err := db.Collection("aircraft").Find(ctx, bson.D{{}})
	if err != nil {
		fmt.Println(err)
	}
	var aircrafts []Aircraft
	err = cursor.All(ctx, &aircrafts)
	if err != nil {
		fmt.Println(err)
	}

	return aircrafts
}

// load from manufacturers.json
func loadManufacturers() map[string]string {
	// Open the file
	file, err := os.Open("manufacturers.json")
	if err != nil {
		fmt.Println(err)
	}

	var data []Manufacturer
	err = json.NewDecoder(file).Decode(&data)
	if err != nil {
		fmt.Println(err)
	}

	manufacturerMap := make(map[string]string)
	for _, manufacturer := range data {
		manufacturerMap[manufacturer.Name] = manufacturer.ID
	}

	return manufacturerMap
}

func addManufacturer(ctx context.Context, db *mongo.Database, aircraft []Aircraft, manufacturers map[string]string) {
	for _, a := range aircraft {
		for mTitle, mID := range manufacturers {
			contains := strings.Contains(a.Title, mTitle)
			if contains {
				title := strings.ReplaceAll(a.Title, mTitle, "")
				title = strings.TrimSpace(title)
				set := bson.M{"$set": bson.M{"manufacturer": mID, "title": title}}
				_, err := db.Collection("aircraft").UpdateOne(ctx, bson.M{"_id": a.ID}, set)
				if err != nil {
					fmt.Println(err)
				}
			}
		}
	}
}

type Manufacturer struct {
	ID   string `json:"id"`   // The ID of the aircraft
	Name string `json:"name"` // The manufacturer of the aircraft
}

type Aircraft struct {
	ID           string `json:"_id" bson:"_id"`                   // The ID of the aircraft
	Manufacturer string `json:"manufacturer" bson:"manufacturer"` // The manufacturer of the aircraft
	Icao         string `json:"icao" bson:"icaoCode"`             // The ICAO code of the aircraft
	Iata         string `json:"iata" bson:"iataCode"`             // The IATA code of the aircraft
	Title        string `json:"title" bson:"title"`               // The title of the aircraft
}
