const Web3=require("web3");
const express=require("express");
const cors=require("cors");
const axios=require("axios");
const abi=require("./abi.json");
const ethers=require("ethers");
const dotenv = require('dotenv');
dotenv.config();
const app=express();
const wallet = ethers.Wallet.fromMnemonic(process.env.SEED_PHRASE);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:false}));
const web3 = new Web3('https://api.s0.ps.hmny.io');
const contract_address="0xAA8A98c19E627B0aD7F50E4aE102769ffD3e55Dd";
const contract = new web3.eth.Contract(abi, contract_address);
app.get("/verify",(req,res)=>{
    const jwt=req.query.jwt;
    const aud=req.query.aud;
    //const JWThash = Web3.utils.sha3(jwt);
    console.log(axios);
    axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${jwt}`).then(async function(resp,err){
      
      if(resp.data.aud==aud){
       const whois=Web3.utils.sha3(resp.data.email);
       const signed_whois=web3.eth.accounts.sign(whois,wallet.privateKey);
       const JWThash = Web3.utils.sha3(jwt);
       const signed_JWThash=web3.eth.accounts.sign(JWThash,wallet.privateKey);
       console.log(signed_JWThash.signature+"$"+signed_whois.signature);
      res.send(signed_JWThash.signature+"$"+signed_whois.signature);
      }
  })
});

app.post("/putproof",(req,res)=>{
  console.log(req.body);
  var d=req.body;

  async function putproof(){
    const tx = contract.methods.authrsign(d.jwthash,d.whoishash,d.sijhash,d.siwhash);
        
    const gas = await tx.estimateGas({
      from: "0x0c57Ab6761f420BaD002cC5fC85829C4Ad61A90f",
    });
    const signT =
      await web3.eth.accounts.signTransaction(
        {
          to: contract_address,
          data: tx.encodeABI(),
          gas:"150000",
        },
        wallet.privateKey
      );
      const createReceipt = await web3.eth.sendSignedTransaction(
        signT.rawTransaction
     );
     console.log(
        `Transaction successful with hash: ${createReceipt.transactionHash}`
     );
    }
    putproof();
    res.send("ok bye");

})
// '0x13b6183e599a3e0e2a90b73ec9064642f71a84a310009f8510e99ec2bdbfc449',
// '0xae964228f2528b758027af613f0b9e6973f2ac7a319c5208cf26c7ded0c67507',
// [0xa3e6017989ebed7d1d2e8103bf84d995182ef283a5bc2d86cff035f61db080a42fa92658232ef64e2eff25daa6d9166fc1fc31b953037444e8f55b18956337171c],
// [0xae9c5732f1a3f12a152cadb74012580d501d57ad3702eff2e3310122933c8da551897022ee5f187f6da0da479efff873c4193a5407d2bd747d3e2e82a528ed981b]

app.get("/gen",(req,res)=>{
  let randomWallet = ethers.Wallet.createRandom();
  res.json({address:randomWallet.address,pk:randomWallet.privateKey});
})

app.listen(4000);
