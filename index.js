const Telegraf = require('telegraf')
const Composer = require('telegraf/composer')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Markup = require('telegraf/markup')
const WizardScene = require('telegraf/scenes/wizard')
const { enter, leave } = Stage
const mongoose = require('mongoose')

mongoose.connect("mongodb+srv://philica:sabifithawok21@cluster0.zot84q1.mongodb.net/AbroBot?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB Connected');
  })
  .catch((err) => {
    console.log(err);
  });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));


const userSchema = new mongoose.Schema({
  chatId:Number,
  name: String,
  phone: Number,
  photo: String
})
const user = mongoose.model('user', userSchema)
const bot = new Telegraf('6229454880:AAELolbagiO2DPkEquD5lT2vLUGlJFT_wAs');
bot.use(session())
// console that our bot has started working 
console.log("bot starting ... ");

//phome number validation function
function validatePhoneNumber(ctx,phoneNumber) {
  // Regular expression that matches phone numbers that start with 09, followed by 8 digits
  const phoneRegex = /^09\d{8}$/;

  // Check if the phone number matches the regular expression and has no non-digit characters
  if (phoneRegex.test(phoneNumber) && !/\D/.test(phoneNumber)) {
    // The phone number is valid
    return true;
  } else {
    // The phone number is invalid
    if (!phoneRegex.test(phoneNumber)) {
      // The phone number doesn't start with 09, followed by 8 digits
      ctx.reply("Phone number must start with 09 and have 10 digits");
    } else if (/\D/.test(phoneNumber)) {
      // The phone number contains non-digit characters
      ctx.reply("Phone number can only contain digits");
    }
    return false;
  }
}

// create an entry scene 
const quoteWizard = new WizardScene(
  'quoteScene',
  (ctx) => {
    ctx.reply('Please enter pickup location');
    ctx.wizard.state.user = {};
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.wizard.state.user.pickupLocation = ctx.message.text;
    ctx.reply('Please enter Destination location');
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.wizard.state.user.destinationLocation = ctx.message.text;
    bot.telegram.sendMessage(ctx.chat.id,'Please enter Pick up time',{
      reply_markup:{
        inline_keyboard:[
          [
            { text:'in 10 minutes', callback_data:'10'}
          ],
          [
            { text:'in 30 minutes', callback_data:'30'}
          ],
          [
            { text:'in 60 minutes', callback_data:'60'}
          ]
        ]
      }
    });
    return ctx.wizard.next();
    
  },

  (ctx) => {
    if(ctx.updateType == 'callback_query'){
      ctx.answerCbQuery()
      ctx.wizard.state.user.pickupTime = ctx.update.callback_query.data;
      bot.telegram.sendMessage(ctx.chat.id,'Please choose prefered gender',{
        reply_markup:{
          inline_keyboard:[
            [
              { text:'Male', callback_data:'Male'}
            ],
            [
              { text:'Female', callback_data:'Female'}
            ],
            [
              { text:'Both works', callback_data:'Both Works'}
            ]
          ]
        }
      });
      
      return ctx.wizard.next();
    }
    else{
      ctx.wizard.back()
      return ctx.wizard.steps[ctx.wizard.cursor](ctx)
    }
    
  },
  (ctx) => {
    if(ctx.updateType == 'callback_query'){
      ctx.answerCbQuery()
      ctx.wizard.state.user.preferedGender = ctx.update.callback_query.data;
    ctx.reply('Please enter Note');
    return ctx.wizard.next();
    }
    else{
      console.log(ctx.wizard)
      ctx.wizard.back()
      return ctx.wizard.steps[ctx.wizard.cursor](ctx)
    }
  }
  ,
  (ctx) => {
    ctx.wizard.state.user.note = ctx.message.text;
    let userData = ctx.wizard.state.user
    console.log(userData)
    let quoteSummaryBot = `You have succesfully requested for ride mate

       Pickup location = ${ctx.wizard.state.user.pickupLocation}
       Destination location  = ${ctx.wizard.state.user.destinationLocation}
       Pickup time  = ${ctx.wizard.state.user.pickupTime}
       Prefered gender  = ${ctx.wizard.state.user.preferedGender}
       Note  = ${ctx.wizard.state.user.note}

      `
      let quoteSummaryGroup = `A user is requesting for a mate on 

      Pickup location = ${ctx.wizard.state.user.pickupLocation}
      Destination location  = ${ctx.wizard.state.user.destinationLocation}
      Pickup time  = ${ctx.wizard.state.user.pickupTime}
      Prefered gender  = ${ctx.wizard.state.user.preferedGender}
      Note  = ${ctx.wizard.state.user.note}

     `
    ctx.reply(quoteSummaryBot);
    bot.telegram.sendMessage(-1001896720993, quoteSummaryGroup,{
      reply_markup:{
        inline_keyboard:[
          [
            { text:'Contact Mate', callback_data:`contactMate_${ctx.chat.id}`}
          ]
        ]
      }
    })
    
    return ctx.scene.leave();
    
  }
);

// create an registeration  scene
const registerationWizard = new WizardScene(
  'registerationScene',
  (ctx) => {
    ctx.reply('Please Enter your full name');
    ctx.wizard.state.user = {};
    ctx.wizard.state.user.chatId = ctx.chat.id
    return ctx.wizard.next();
  },
  (ctx) =>{
    ctx.wizard.state.user.name = ctx.message.text
    ctx.reply('Please enter your phone number with the correct format \n\n Ex 0912345678')
    return ctx.wizard.next()
  },
  (ctx) => {
    if(validatePhoneNumber(ctx,ctx.message.text)){
      ctx.wizard.state.user.phone = parseInt(ctx.message.text)
      ctx.reply('please upload photo of your Id')
      return ctx.wizard.next()
    }else{
      ctx.wizard.back();  // Set the listener to the previous function
      return ctx.wizard.steps[ctx.wizard.cursor](ctx);
    }
    
  },
  (ctx) => {
    const photo = ctx.update.message.photo[0].file_id
    ctx.wizard.state.user.photo = photo
    // create new user 
    const newUser = new user(ctx.wizard.state.user)
    newUser.save()
    .then((result)=>{
      console.log("user succesfully registered",result)
      ctx.reply('You are now succesfully register please use the /start command to start using our service')

      return ctx.scene.leave();
    })
    .catch((err)=>{
      console.log(err)
    })
    return ctx.scene.leave();
  }
)

//a function that handles contact mate action
bot.action(/contactMate_(.*)/, (ctx) => {
  let from = ctx.update.callback_query.from.username
  let to = parseInt(ctx.match[1])
  console.log(`from ${from} to ${to}`)
  bot.telegram.sendMessage(to,`@${from} is waiting to share ride with you on your recent quote, please conatact them shortly within 5 minutes or else your request will expire \n\n Thank you for using our service `)
  ctx.reply("your request has been sent succesfully , your ride mate will contact you shortly , if that did not happen in 5 minutes please try other options \n\n Thank you for using our service")
  ctx.answerCbQuery()
})

const stage = new Stage()
stage.register(quoteWizard)
stage.register(registerationWizard)


bot.use(stage.middleware());

bot.start((ctx) => {
  user.findOne({chatId: ctx.chat.id})
  .then((result)=>{
    if(result){
      console.log(result)
      return ctx.scene.enter('quoteScene')
    }
    else{
      ctx.reply("please register first to start using our service by using the /register command ")
    }
  })
  .catch((err)=>{
    console.log(err)
  })
 
})

bot.command('register', (ctx) => {
  user.findOne({chatId:ctx.chat.id})
  .then((result) => {
    if(result){
      console.log(result)
      console.log("you have already registered")
      ctx.reply("you have already registered, please use the /start command to start using our service")
    }
    else{
      ctx.scene.enter('registerationScene')
    }
  })
  .catch((err) => console.log(err))
})
// bot.on("photo",(ctx)=>{
//   console.log('photo uploaded ...')
//   console.log(ctx.update.message.photo[0].file_id)
//   ctx.replyWithPhoto(ctx.update.message.photo[0].file_id)
 
// })

bot.on("message",(ctx)=>{
  ctx.reply('please use the /start command')
  console.log(
    `
    Username = ${ctx.chat.first_name}
    User Id = ${ctx.chat.id}
    `
    )
})



bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
