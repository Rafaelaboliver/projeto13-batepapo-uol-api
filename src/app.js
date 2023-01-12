import express from 'express';
import cors from 'cors';


const app = express();
app.use(express.json());
app.use(cors());

app.get('', (req, res) => {

});

app.post('', (req, res) => {
        
});

const PORT = 5003;
app.listen (PORT, () => console.log(`servidor rodando na paz do Senhor na porta ${PORT}`))