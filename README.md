# Introduction
### This is an instant messaging tool in React Native. The features include the following:

- [x] Online/offline user status
- [x] Delivery reports (like WhatsApp)
- [x] Media sharing
- [x] Rich text/Emoji’s

# Demo
![Demo on youtube](https://youtu.be/ugA1DqM4oIE)
# Prerequisite

$ npm install -g react-native-cli

# How to set up ⬆️

Step 1: git clone this repo:

Step 2: cd to the cloned repo:

Step 3: Install the Application with npm install

Step 4: npm install && react-native link

# How to Run ▶️

### for android
* Run emulator
* $ react-native run-android

### for iOS
* $ react-native run-ios

#### If the keyboard doesn't show up in iOS simulator, press ⌘ + K

#### If you want to run multiple iOS simulators
Using MacOs Terminal, launch first simulator:

* $ cd /Applications/Xcode.app/Contents/Developer/Applications
* $ open -n Simulator.app
* $ cd `<your react native project>`
* $ react-native run-ios

Now, launch 2nd simulator:

* $ cd /Applications/Xcode.app/Contents/Developer/Applications
* $ open -n Simulator.app
* Click "Ok" when you get "Unable to boot device in current state"
* Change simulator to be different than first simulator (e.g. Hardware -> Device -> iPhone 6s)
* $ cd `<your react-native project>`
* $ react-native run-ios --simulator "iPhone 6s" (or whatever simulator you chose in step 8).

