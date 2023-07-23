const Telegraf = require('telegraf')
const Composer = require('telegraf/composer')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Markup = require('telegraf/markup')
const WizardScene = require('telegraf/scenes/wizard')
const { enter, leave } = Stage

const bot = new Telegraf('6229454880:AAELolbagiO2DPkEquD5lT2vLUGlJFT_wAs');

// console that our bot has started working 
console.log("bot starting ... ");

// create an entry scene 
const registrationWizard = new WizardScene(
  'nameScene',
  (ctx) => {
    ctx.reply('Please enter pickup location');
    ctx.wizard.state.user = {};
    console.log(ctx.session.userID)
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
    ctx.wizard.state.user.pickupTime = ctx.update.callback_query.data;
    bot.telegram.sendMessage(ctx.chat.id,'Please choose prefered gender',{
      reply_markup:{
        inline_keyboard:[
          [
            { text:'Male', callback_data:'Male'}
          ],
          [
            { text:'Female', callback_data:'Female'}
          ]
        ]
      }
    });
    
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.wizard.state.user.preferedGender = ctx.update.callback_query.data;
    ctx.reply('Please enter Note');
    return ctx.wizard.next();
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
stage.register(registrationWizard)

bot.use(session())
bot.use(stage.middleware());

bot.start((ctx) => {
  ctx.session.userID = ctx.chat.id;
  let userID = ctx.session.userID;
  console.log(
    `
    Username = ${ctx.chat.first_name}
    User Id = ${userID}
    `
    )

 return ctx.scene.enter('nameScene')
})
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
