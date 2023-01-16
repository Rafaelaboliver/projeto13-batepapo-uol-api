import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import joi from 'joi';
import { MongoClient } from 'mongodb';
import dayjs from 'dayjs';
import utf8 from "utf8";

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

    const validation = userSchema.validate(user, { abortEarly: false });
    if (validation.error) {
        const errors = validation.error.details.map((err) => {
            return err.message
        })
        return res.status(422).send(errors)
    }

    try {
        const userCreated = await db.collection('participants').findOne({ name: user.name.toLowerCase() });
        if (userCreated) return res.status(409).send('Usuário já cadastrado!');

        await db.collection('participants').insertOne({ name: user.name.toLowerCase(), lastStatus: Date.now() });
        await db.collection('messages').insertOne({ from: user.name.toLowerCase(), to: 'Todos', text: 'entra na sala...', type: 'status', time: dayjs(Date.now()).format('HH:mm:ss') });
        res.status(201).send('Ingresso realizado com sucesso!');

    } catch (error) {
        console.log(error);
        return res.status(500).send('Erro no servidor');
    };

});

//requisito: GET('participants')
app.get('/participants', async (req, res) => {

    try {

        const info = await db.collection('participants').find().toArray();
        console.log('INFO recebe=>', info)
        return res.send(info);

    } catch (error) {
        res.status(500).send('Erro no servidor!')
    }
});

//requisito: POST('messages')
app.post('/messages', async (req, res) => {
    const data = req.body
    let from = req.headers.user;

    if(!from) {
        return res.status(422).send('Falta um requisito')
    };
    
    from = utf8.decode(from);

    const dataSchema = joi.object({
        to: joi.string().empty().required(),
        text: joi.string().empty().required(),
        type: joi.string().valid('message', 'private_message').required()
    });

    const validation = dataSchema.validate(data, { abortEarly: false });
    if (validation.error) {
        const errors = validation.error.details.map((err) => {
            return err.message
        })
        return res.status(422).send(errors)
    }

    const user = await db.collection('participants').findOne({ name: from });
    if (!user) {
        return res.status(401).send('UNAUTHORIZED');
    }

    try {
        const model = await db.collection('messages').insertOne({ from: from, to: data.to, text: data.text, type: data.type, time: dayjs(Date.now()).format('HH:mm:ss') });
        return res.status(201).send(model);

    } catch (error) {
        console.log(error);
        res.status(500).send('Erro no servidor!');
    };


});

//requisito: GET('messages')
app.get('/messages', async (req, res) => {
    const user = req.headers.user;
    try {
        const { limit } = req.query;
        const message = await db.collection('messages').find({
            $or: [
                { to: user },
                { from: user },
                { to: "Todos" },
                { type: "message" },
            ],
        }).toArray();
        const display = (message.length - limit)
        return res.send(message.slice(display).reverse());

    } catch (error) {
        res.status(500).send('Erro no servidor!')
    }

});

//requisito: POST('status')
app.post('/status', async (req, res) => {

    const userUpdate = req.headers.user;
    const user = await db.collection('participants').findOne({ name: userUpdate });
    if (!user) return res.status(404).send('Participante não encontrado');

    try {
        await db.collection('participants').updateOne(
            { name: userUpdate },
            { $set: { lastStatus: Date.now() } }
        );

        res.status(200).send('Status atualizado!');

    } catch (error) {
        console.log(error)
        res.status(500).send('Erro no servidor!')
    }
});

//requisito: remoção automática dos usuários inativos
function handlleDeleteUser() {

    setInterval(async () => {
        const participant = await db.collection('participants').find().toArray();
        participant.map(async (item) => {
            if (Date.now() - item.lastStatus > 10000) {
                await db.collection('participants').deleteOne({ name: item.name });
                await db.collection('messages').insertOne({ from: item.name, to: 'Todos', text: 'sai da sala...', type: 'status', time: dayjs(Date.now()).format('HH:mm:ss') })
            }
        })
    }, 15000)
}

handlleDeleteUser();

//LEMBRETE: alterar a porta do servidor para 5000 antes de enviar o projeto
const PORT = 5000;
app.listen(PORT, () => console.log(`servidor rodando na paz do Senhor na porta ${PORT}`))