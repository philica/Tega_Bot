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
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.wizard.state.user.pickupLocation = ctx.message.text;
    ctx.reply('Please enter Destination location');
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.wizard.state.user.destinationLocation = ctx.message.text;
    ctx.reply('Please enter Pick up time');
    return ctx.wizard.next();
  },

  (ctx) => {
    ctx.wizard.state.user.pickupTime = parseInt(ctx.message.text);
    ctx.reply('Please enter prefered gender');
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.wizard.state.user.preferedGender = ctx.message.text;
    ctx.reply('Please enter Note');
    return ctx.wizard.next();
  }
  ,
  (ctx) => {
    ctx.wizard.state.user.note = ctx.message.text;
    let userData = ctx.wizard.state.user
    console.log(userData)
    ctx.reply(
      `Thanks for filling out the information
       Pickup location = ${ctx.wizard.state.user.pickupLocation}
       Destination location  = ${ctx.wizard.state.user.destinationLocation}
       Pickup time  = ${ctx.wizard.state.user.pickupTime}
       Prefered gender  = ${ctx.wizard.state.user.preferedGender}
       Note  = ${ctx.wizard.state.user.note}

      `
    );
    return ctx.scene.leave();
  }
);

// const stage = new Stage([registrationWizard], { default: 'nameScene' });

const stage = new Stage()
stage.register(registrationWizard)

bot.use(session())
bot.use(stage.middleware());
// bot.hears('hi',(ctx) => {
//     return ctx.scene.enter('nameScene')
// });
bot.start((ctx) => ctx.scene.enter('nameScene'))
bot.launch();