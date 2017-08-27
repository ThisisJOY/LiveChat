console.disableYellowBox = true;

import React, { Component } from "react";
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  AppState,
  Modal,
  ListView,
  Platform,
  Image,
  ActivityIndicator,
  Dimensions
} from "react-native";
import BackgroundTimer from "react-native-background-timer";
import moment from "moment";
import ImagePicker from "react-native-image-crop-picker";
import RNFetchBlob from "react-native-fetch-blob";
import DeviceInfo from "react-native-device-info";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import * as firebase from "firebase";
// Initialize Firebasec
const config = {
  apiKey: "AIzaSyDW-EM4qpn511y88i-yRVdgKz3_pvJ02GI",
  authDomain: "livechat-17e04.firebaseapp.com",
  databaseURL: "https://livechat-17e04.firebaseio.com",
  projectId: "livechat-17e04",
  storageBucket: "livechat-17e04.appspot.com",
  messagingSenderId: "1024443238538"
};
firebase.initializeApp(config);

const user = DeviceInfo.getUniqueID();

const ds = new ListView.DataSource({
  rowHasChanged: (r1, r2) => r1 !== r2
});

export default class LiveChat extends Component {
  constructor(props) {
    super(props);
    this.database = firebase.database();
    this.state = {
      chat: "",
      chats: [],
      userOnline: 0,
      modalVisible: true,
      name: "Anonymous",
      loading: false,
      imageURL: null,
      user: user
    };
    this.userOnlineRef = this.database.ref("userOnline");
    this.chatsRef = this.database.ref("chats");
    AppState.addEventListener("change", this.handleAppStateChange);
  }

  handleAppStateChange = () => {
    console.log("AppState", AppState.currentState);
    if (AppState.currentState == "active") {
      this.getNumberOfUserOnlineOnceAndIncreaseBy1ByTransaction();
    } else if (AppState.currentState == "inactive") {
      BackgroundTimer.setTimeout(() => {
        this.decreaseNumberOfUserOnlineByTransaction();
      }, 0);
    }
  };

  getNumberOfUserOnlineOnceAndIncreaseBy1 = () => {
    this.userOnlineRef.once("value", snapshot => {
      this.userOnlineRef.set(snapshot.val() + 1);
    });
  };

  /* queue firebase requests when two or
   *  more users enter the app at the same time.
   */
  getNumberOfUserOnlineOnceAndIncreaseBy1ByTransaction = () => {
    this.userOnlineRef.transaction(function(currentUserOnline) {
      return currentUserOnline + 1;
    });
  };

  decreaseNumberOfUserOnline = () => {
    this.userOnlineRef.once("value", snapshot => {
      this.userOnlineRef.set(snapshot.val() - 1);
    });
  };

  /* queue firebase requests when two or
   *  more users leave the app at the same time.
   */
  decreaseNumberOfUserOnlineByTransaction() {
    this.userOnlineRef.transaction(function(currentUserOnline) {
      return currentUserOnline > 0 ? currentUserOnline - 1 : 0;
    });
  }

  listeningForNumberOfUserOnline = () => {
    this.userOnlineRef.on("value", snapshot => {
      console.log("UserOnline change", snapshot.val());
      this.setState({ userOnline: snapshot.val() });
    });
  };

  listeningForChatChange = () => {
    this.chatsRef.on("value", snapshot => {
      console.log("Chats change:", snapshot.val());
      this.setState({ chats: snapshot.val() });
    });
  };

  componentDidMount() {
    this.listeningForNumberOfUserOnline();
    this.getNumberOfUserOnlineOnceAndIncreaseBy1();
    this.listeningForChatChange();
  }

  sendChat = () => {
    console.log(this.state.chat);
    // send chat when a uesr inputs some text, otherwise take no action
    if (this.state.chat) {
      this.chatsRef.transaction(chats => {
        if (!chats) {
          chats = [];
        }
        chats.push({
          name: this.state.name,
          chat: this.state.chat,
          when: new Date().getTime()
        });
        this.setState({ chat: "" });
        return chats;
      });
    }
  };

  // convert image to blob, upload image to firebase storage, save the imageURL in firebase database
  sendImage = () => {
    this.setState({ loading: true });
    const Blob = RNFetchBlob.polyfill.Blob;
    const fs = RNFetchBlob.fs;
    window.XMLHttpRequest = RNFetchBlob.polyfill.XMLHttpRequest;
    window.Blob = Blob;
    const uid = this.state.user;
    ImagePicker.openPicker({
      width: 300,
      height: 300,
      cropping: true,
      mediaType: "photo"
    })
      .then(image => {
        const imagePath = image.path;
        const imageName = imagePath.substr(imagePath.lastIndexOf("/") + 1);

        let uploadBlob = null;

        const imageRef = firebase.storage().ref(uid).child(imageName);
        let mime = "image/jpg";
        fs
          .readFile(imagePath, "base64")
          .then(data => {
            console.log(data);
            return Blob.build(data, { type: `${mime};BASE64` });
          })
          .then(blob => {
            uploadBlob = blob;
            return imageRef.put(blob, { contentType: mime });
          })
          .then(() => {
            uploadBlob.close();
            return imageRef.getDownloadURL();
          })
          .then(url => {
            this.setState({ loading: false, imageURL: url });
            console.log(this.state.imageURL);
            this.chatsRef.transaction(chats => {
              if (!chats) {
                chats = [];
              }
              chats.push({
                name: this.state.name,
                imageURL: this.state.imageURL,
                when: new Date().getTime()
              });
              this.setState({ imageURL: null });
              return chats;
            });
          })
          .catch(error => {
            console.log(error);
          });
      })
      .catch(error => {
        console.log(error);
      });
  };

  renderChatRow(rowData) {
    return (
      <View style={styles.chatContainer}>
        <View style={styles.chatMeta}>
          <Text style={styles.bold}>
            {rowData.name || "Anonymous"}
          </Text>
          <Text style={{ flex: 1 }} />
          <Text>
            {moment(rowData.when).fromNow()}
          </Text>
        </View>
        {rowData.chat
          ? <View style={styles.chat}>
              <Text style={styles.chatText}>
                {rowData.chat}
              </Text>
            </View>
          : null}
        {rowData.imageURL
          ? <Image style={styles.image} source={{ uri: rowData.imageURL }} />
          : null}
      </View>
    );
  }

  render() {
    const content = (
      <View style={styles.container}>
        <KeyboardAwareScrollView behavior="position">
          <Modal
            animationType={"slide"}
            transparent={true}
            visible={this.state.modalVisible}
          >
            <View style={styles.modal}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => this.setState({ modalVisible: false })}
              >
                <Text>X</Text>
              </TouchableOpacity>
              <Text>Please input your name.</Text>
              <TextInput
                style={styles.textInput}
                value={this.state.name}
                underlineColorAndroid="transparent"
                onChangeText={input => this.setState({ name: input })}
              />
              <TouchableOpacity
                style={styles.submitButton}
                onPress={() => {
                  this.setState({ modalVisible: false });
                }}
              >
                <Text style={styles.buttonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </Modal>
          <View style={styles.header}>
            <Text style={styles.headerLabelText}>
              Welcome {this.state.name}!
            </Text>
            <Text style={styles.labelText}>
              Online Users: {this.state.userOnline}
            </Text>
          </View>
          <View style={styles.content}>
            {this.state.chats
              ? <ListView
                  dataSource={ds.cloneWithRows(this.state.chats)}
                  enableEmptySections
                  renderRow={rowData => this.renderChatRow(rowData)}
                />
              : null}
          </View>
          <View style={styles.footer}>
            <TouchableOpacity style={styles.button} onPress={this.sendImage}>
              <Text style={styles.buttonText}>Send Image</Text>
            </TouchableOpacity>
            <TextInput
              keyboardType={"default"}
              style={styles.textInput}
              placeholder={"Type a message..."}
              value={this.state.chat}
              underlineColorAndroid="transparent"
              onChangeText={input => this.setState({ chat: input })}
            />
            <TouchableOpacity style={styles.button} onPress={this.sendChat}>
              <Text style={styles.buttonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>
      </View>
    );

    return (
      <View style={styles.container}>
        {this.state.loading
          ? <ActivityIndicator
              style={{ flex: 1 }}
              animating={this.state.loading}
            />
          : content}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  chatMeta: {
    flexDirection: "row"
  },
  chat: {
    backgroundColor: "#FFC0CB",
    borderRadius: 10,
    padding: 5
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
    padding: 5
  },
  chatText: {
    color: "white",
    fontWeight: "bold"
  },
  container: {
    flex: 1,
    paddingTop: 20
  },
  content: {
    height: Dimensions.get("window").height - 165,
    padding: 10,
    flex: 1
  },
  headerLabelText: {
    fontSize: 20
  },
  labelText: {
    fontSize: 15
  },
  header: {
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    padding: 5,
    backgroundColor: "#FFE4E1"
  },
  footer: {
    height: 50,
    flexDirection: "row"
  },
  textInput: {
    flex: 1,
    height: 50,
    width: 200,
    padding: 5,
    backgroundColor: "white",
    borderWidth: 1,
    borderRadius: 5
  },
  button: {
    width: 100,
    backgroundColor: "#f96062",
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center"
  },
  buttonText: {
    fontSize: 20,
    color: "white"
  },
  modal: {
    height: 150,
    width: 300,
    marginTop: 200,
    padding: 10,
    alignSelf: "center",
    backgroundColor: "#FFE4E1",
    margin: 10,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center"
  },
  closeButton: {
    alignSelf: "flex-end"
  },
  submitButton: {
    alignSelf: "center",
    backgroundColor: "#f96062",
    width: 100,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    margin: 10
  },
  bold: {
    fontWeight: "bold"
  }
});
