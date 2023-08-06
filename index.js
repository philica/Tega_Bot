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
  chatId: Number,
  name: String,
  phone: Number,
  idPhoto: String,
  idFile: String,
  userPhoto: String,
  verified: Boolean
})

const user = mongoose.model('user', userSchema)
const bot = new Telegraf('6622448222:AAH8-menqDuHA2DMebQgFK6IQQsJG1ftoNU');
bot.use(session())
// console that our bot has started working 
console.log("bot starting ... ");

//phome number validation function
function validatePhoneNumber(ctx, phoneNumber) {
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
    ctx.reply('📍 Please enter Pick up location')
    ctx.wizard.state.user = {};
    return ctx.wizard.next();
  },
  (ctx) => {
    if (ctx.message.text) {
      if (ctx.message.text[0] == '/') {
        ctx.reply("⚠️ process terminated , please try again with the correct Input")
        return ctx.scene.leave()
      }
      ctx.wizard.state.user.pickupLocation = ctx.message.text;
      ctx.reply('📍 Please enter Destination location ');
      return ctx.wizard.next();
    }

  },
  (ctx) => {
    if (ctx.message.text[0] == '/') {
      ctx.reply("⚠️ process terminated , please try again with the correct Input")
      return ctx.scene.leave()
    }
    ctx.wizard.state.user.destinationLocation = ctx.message.text;
    bot.telegram.sendMessage(ctx.chat.id, '⏰ Please enter Pick up time', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '⏰ in 10 minutes', callback_data: '10' }
          ],
          [
            { text: '⏰ in 30 minutes', callback_data: '30' }
          ],
          [
            { text: '⏰ in 60 minutes', callback_data: '60' }
          ]
        ]
      }
    });
    return ctx.wizard.next();

  },

  (ctx) => {
    if (ctx.updateType != 'callback_query') {
      ctx.reply('⚠️ your input was incorrect')
      bot.telegram.sendMessage(ctx.chat.id, '⏰ Please enter Pick up time', {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '⏰ in 10 minutes', callback_data: '10' }
            ],
            [
              { text: '⏰ in 30 minutes', callback_data: '30' }
            ],
            [
              { text: '⏰ in 60 minutes', callback_data: '60' }
            ]
          ]
        }
      });
      return;
    }
    ctx.answerCbQuery()
    ctx.wizard.state.user.pickupTime = ctx.update.callback_query.data;
    bot.telegram.sendMessage(ctx.chat.id, 'Please choose prefered gender 👦👧', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '👦 Male', callback_data: 'Male' }
          ],
          [
            { text: '👧 Female', callback_data: 'Female' }
          ],
          [
            { text: 'Both works', callback_data: 'Both Works' }
          ]
        ]
      }
    });

    return ctx.wizard.next();


  },
  (ctx) => {

    if (ctx.updateType != 'callback_query') {
      ctx.reply('your input was incorrect')
      bot.telegram.sendMessage(ctx.chat.id, 'Please choose prefered gender 👦👧', {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '👦 Male', callback_data: 'Male' }
            ],
            [
              { text: '👧 Female', callback_data: 'Female' }
            ],
            [
              { text: 'Both works', callback_data: 'Both Works' }
            ]
          ]
        }
      });
      return;
    }
    ctx.answerCbQuery()
    ctx.wizard.state.user.preferedGender = ctx.update.callback_query.data;
    ctx.reply('📝 Please enter Note');
    return ctx.wizard.next();

  }
  ,
  (ctx) => {
    ctx.wizard.state.user.note = ctx.message.text;
    let userData = ctx.wizard.state.user
    console.log(userData)
    let quoteSummaryBot = `
    ✅ You have succesfully requested for ride mate

    📍 Pickup location = ${ctx.wizard.state.user.pickupLocation}
    📍 Destination location  = ${ctx.wizard.state.user.destinationLocation}
    ⏰ Pickup time  = "${ctx.wizard.state.user.pickupTime}  min"
    👫 Prefered gender  = ${ctx.wizard.state.user.preferedGender}
    📝 Note  = ${ctx.wizard.state.user.note}

      `
    let quoteSummaryGroup = `
    🚕 A user is requesting for a mate on 

    📍 Pickup location = ${ctx.wizard.state.user.pickupLocation}
    📍 Destination location  = ${ctx.wizard.state.user.destinationLocation}
    ⏰ Pickup time  = "${ctx.wizard.state.user.pickupTime} min"
    👫 Prefered gender  = ${ctx.wizard.state.user.preferedGender}
    📝 Note  = ${ctx.wizard.state.user.note}

     `
    ctx.reply(quoteSummaryBot);
    bot.telegram.sendMessage(-1001896720993, quoteSummaryGroup, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Contact Mate', callback_data: `contactMate_${ctx.chat.id}` }
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
  (ctx) => {
    ctx.wizard.state.user.name = ctx.message.text
    ctx.reply('Please enter your phone number with the correct format \n\n Ex 0912345678')
    return ctx.wizard.next()
  },
  (ctx) => {
    if (!validatePhoneNumber(ctx, ctx.message.text)) {
      ctx.reply('Please enter your phone number with the correct format \n\n Ex 0912345678')
      return
    }
    ctx.wizard.state.user.phone = parseInt(ctx.message.text)
    ctx.reply('please upload photo of your Id in PNG or PDF format')
    return ctx.wizard.next()


  },
  (ctx) => {

    if (ctx.updateSubTypes[0] == 'photo') {
      const idPhoto = ctx.update.message.photo[0].file_id
      ctx.wizard.state.user.idPhoto = idPhoto
      ctx.reply("please take selfie of your face")
      return ctx.wizard.next()
    }
    else if (ctx.updateSubTypes[0] == 'document') {

      const idFile = ctx.message.document.file_id
      ctx.wizard.state.user.idFile = idFile
      ctx.reply("please take selfie of your face")
      return ctx.wizard.next()
      console.log(ctx.message.document.thumbnail.file_id)

    }
    else {
      ctx.reply("Please send a valid photo of your ID in PNG or PDF format")
      return
    }
  },
  (ctx) => {
    if (ctx.updateSubTypes[0] != 'photo') {
      ctx.reply("please input valid file format ")
      ctx.reply("please take selfie of your face")
      return
    }

    const userPhoto = ctx.update.message.photo[0].file_id
    ctx.wizard.state.user.userPhoto = userPhoto
    ctx.wizard.state.user.verified = false
    // create new user 
    const newUser = new user(ctx.wizard.state.user)
    newUser.save()
      .then((result) => {
        console.log("user succesfully registered", result)
        ctx.reply('You are now succesfully registered , you will be able to start using our service as soon as our team verifies your account 👍 ')
        return ctx.scene.leave();
      })
      .catch((err) => {
        console.log(err)
      })
    return ctx.scene.leave();
  }
)


//user verification scene 
const verificationWizard = new WizardScene(
  'verificationScene',
  (ctx) => {
    ctx.reply('Please input Login password')
    return ctx.wizard.next()
  },
  (ctx) => {
    if (ctx.message.text == 'admin') {

      user.find({ verified: false })
        .then((result) => {
          console.log(result)
          if (result.length == 0) {
            ctx.reply("No additional user to verify")
          }
          //iterate through each and every un verified user
          result.forEach((user) => {
            let media = [{
              type: 'photo',
              media: user.userPhoto,
              caption: 'This is a beautiful photo.'
            },
            {
              type: 'photo',
              media: user.idPhoto || 'https://img.freepik.com/free-vector/no-data-concept-illustration_114360-2506.jpg?size=626&ext=jpg&ga=GA1.2.963996254.1685645944&semt=ais',
              caption: 'This is a beautiful photo.'
            },
            ]
            ctx.telegram.sendMediaGroup(ctx.message.chat.id, media)
            if(user.idFile){
              ctx.replyWithDocument(user.idFile)
            }
            let usera =
              `
      user name = ${user.name}
phone = ${user.phone}
      `
            bot.telegram.sendMessage(ctx.chat.id, usera, {
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: '✅ Accept', callback_data: `verified_${user.chatId}` },
                    { text: '❌ Decline', callback_data: `Declined_${user.chatId}` }
                  ],

                ]
              }
            })
          })

        })
        .catch((err) => {
          console.log(err)
        })

      return ctx.scene.leave()
    }
    else {

      ctx.reply('The password you entered is not correct please try again')
      return ctx.scene.leave()
    }
  }
)

//a function that handles contact mate action
bot.action(/contactMate_(.*)/, (ctx) => {
  let from = ctx.update.callback_query.from.username
  let to = parseInt(ctx.match[1])
  console.log(`from ${from} to ${to}`)
  bot.telegram.sendMessage(to, `@${from} is waiting to share ride with you on your recent quote, please conatact them shortly within 5 minutes or else your request will expire \n\n Thank you for using our service `)
  ctx.reply("your request has been sent succesfully , your ride mate will contact you shortly , if that did not happen in 5 minutes please try other options \n\n Thank you for using our service")
  ctx.answerCbQuery()
})



const stage = new Stage()
stage.register(quoteWizard)
stage.register(registerationWizard)
stage.register(verificationWizard)


bot.use(stage.middleware());

bot.start((ctx) => {
  user.findOne({ chatId: ctx.chat.id })
    .then((result) => {
      if (result) {
        if (!result.verified) {
          return ctx.reply('please wait till our team verifies your account')
        }
        console.log(result)
        return ctx.scene.enter('quoteScene')
      }
      else {
        ctx.reply("please register first to start using our service by using the /signup command ")
      }
    })
    .catch((err) => {
      console.log(err)
    })

})

bot.command('signup', (ctx) => {
  user.findOne({ chatId: ctx.chat.id })
    .then((result) => {
      if (result) {
        ctx.reply("you have already registered, please use the /start command to start using our service")
      }
      else {
        ctx.scene.enter('registerationScene')
      }
    })
    .catch((err) => console.log(err))
})

bot.command('cancel', (ctx) => {
  // Exit the current scene and return to the previous scene or the main scene
  ctx.scene.leave();
  ctx.reply('Process Canceled.');
});



//verify user account
bot.command('verify', (ctx) => {
  ctx.scene.enter('verificationScene')
})

bot.action(/verified_(.*)/, (ctx) => {
  let to = parseInt(ctx.match[1])
  console.log(to)
  user.updateOne({ chatId: to }, { $set: { verified: true } })
    .then((result) => {
      console.log(result)
      bot.telegram.sendMessage(to, `congratulation 🎊🎊🎊
    After carefully assesing your document your account is verified ✅
    please join this telegram group to receive requests 
    
    Tega Group : https://t.me/+P6jIyIbIp6M0ZTJk

    `)

    })
    .catch((err) => {
      console.log(err)
    })


  ctx.answerCbQuery()
})




// bot.on("photo",(ctx)=>{
//   console.log('photo uploaded ...')
//   console.log(ctx.update.message.photo[0].file_id)
//   ctx.replyWithPhoto(ctx.update.message.photo[0].file_id)

// })

bot.on("message", (ctx) => {
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
