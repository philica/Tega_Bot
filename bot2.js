const { Telegraf } = require('telegraf');
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Scene = require('telegraf/scenes/base')
const WizardScene = require('telegraf')
const { leave } = Stage

const bot = new Telegraf('6229454880:AAELolbagiO2DPkEquD5lT2vLUGlJFT_wAs');

// console that our bot has started working 
console.log("bot starting ... ");

// create an entry scene 
const registrationWizard = new WizardScene(
  'nameScene',
  (ctx) => {
    ctx.reply('Welcome, enter your name');
    ctx.wizard.state.user = {};
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.wizard.state.user.name = ctx.message.text;
    ctx.reply('Enter your age');
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.wizard.state.user.age = ctx.message.text;
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.reply(
      `Thanks for filling out the information
       your name = ${ctx.wizard.state.user.name}
       your age = ${ctx.wizard.state.user.age}
      `
    );
    return ctx.scene.leave();
  }
);

bot.use(WizardScene)
const stage = new Stage([registrationWizard]);


bot.use(stage.middleware());
bot.hears('hi',(ctx) => {
    ctx.scene.enter('nameScene')
});
bot.launch();