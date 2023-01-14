import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import joi from 'joi';
import { MongoClient } from 'mongodb';
import dayjs from 'dayjs';

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
    const user = req.body
    const userSchema = joi.object({
        name: joi.string().empty().required()
    });

    const validation = userSchema.validate(user, {abortEarly: false});
    if(validation.error) {
        const errors = validation.error.details.map((err) => {
            return err.message
        })
        return res.status(422).send(errors)
    }
    try {
        const userCreated = await db.collection('participants').findOne({name: user.name});
        if (userCreated) return res.status(409).send('Usuário já cadastrado!');

        await db.collection('participants').insertOne({name: user.name, lastStatus: Date.now()});
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
app.post('/messages', async (req, res) => {
    const data = req.body
    const dataSchema = joi.object({
        to: joi.string().empty().required(),
        text: joi.string().empty().required(),
        type: joi.message().private_message().required()
    });

    const validation = dataSchema.validate(data, {abortEarly: false});
    console.log(validation);
    try {
        const model = await db.collection('messages').insertOne({to: data.to, text: data.text, type: data.type, time: dayjs(Date.now()).format('HH:mm:ss')});
        return res.status(201).send(model);

    } catch (error) {
        console.log(error);
        res.status(500).send('Erro no servidor!');
    };
    

});

//requisito: GET('messages')
app.get('/messages', async (req, res) => {
     
    try {
        const {limit} = req.query;
        const message = await db.collection('messages').find().toArray();
        const display = (message.length - limit)
        return res.send(message.slice(display));

    } catch (error) {
        res.status(500).send('Erro no servidor!')
    }
});

//requisito: POST('status')
app.post('/status', async (req, res) => {

})

//LEMBRETE: alterar a porta do servidor para 5000 antes de enviar o projeto
const PORT = 5003;
app.listen (PORT, () => console.log(`servidor rodando na paz do Senhor na porta ${PORT}`))