import { Image } from "./images";

const SignInBulletin = {
  id: "signInBulletin",
  normal: Image.Bulletin,
  x: 14, // use mapmaker to find the location you want
  y: 2,
  type: 7, // type 5s are the ones for extensions. emit an event we'll listen for below
  width: 1, // you're supposed to specify this even though it's something we could figure out from the image, sorry
  height: 2, // 1 tile is 32px
  // new variables
  previewMessage: "press x to sign in", // this is what shows up in the press x bubble
  properties: {
    extensionData: {
      entries: [
        {
          type: "header",
          value: "enter your repl.it username here",
          key: "bulletinHeader"
        },
        {
          type: "text",
          value: "username",
          key: "submitUsername"
        },
      ]
    }
  }
};

export default SignInBulletin;