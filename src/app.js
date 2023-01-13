import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config()

let db;
const mongoClient = new MongoClient(process.env.DATABASE_URL);

mongoClient.connect()
    .then(() => {
        db = mongoClient.db();
    })
    .catch(() => {
        console.log('fiz algo de errado na conexão com o db')
    })

const app = express();
app.use(express.json());
app.use(cors());

app.get('', (req, res) => {

});

app.post('', (req, res) => {
        
});

//LEMBRETE: alterar a porta do servidor para 5000 antes de enviar o projeto
const PORT = 5003;
app.listen (PORT, () => console.log(`servidor rodando na paz do Senhor na porta ${PORT}`))