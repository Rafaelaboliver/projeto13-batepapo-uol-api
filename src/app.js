import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config()

let db;
const mongoClient = new MongoClient(process.env.DATABASE_URL);

try {
    await mongoClient.connect()
    db = mongoClient.db();
} catch (error) {
    console.log('Erro ao conectar com o servidor!')
}

const app = express();
app.use(express.json());
app.use(cors());


//requisito: POST('participants')
app.post('/participants', async (req, res) => {
    const { name, lastStatus} = req.body

    try {
        const userCreated = await db.collection('participants').findOne({name});
        if (userCreated) return res.status(409).send('Usuário já cadastrado!');

        await db.collection('participants').insertOne({name, lastStatus: Date.now()});
        res.status(201).send('Cadastro realizado com sucesso!');

    } catch (error) {
        console.log(error);
        return res.status(500).send('Erro no servidor');
    };

});

//requisito: GET('participants')
app.get('/participants', async (req, res) => {
     
     try {
        const info = await db.collection('participants').find().toArray();
        return res.send(info);

     } catch (error) {
        res.status(500).send('Erro no servidor!')
     }
});

//requisito: POST('messages')

//requisito: GET('messages')

//LEMBRETE: alterar a porta do servidor para 5000 antes de enviar o projeto
const PORT = 5003;
app.listen (PORT, () => console.log(`servidor rodando na paz do Senhor na porta ${PORT}`))