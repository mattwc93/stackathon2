import React from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Button
} from 'react-native';
import { WebBrowser } from 'expo';
import { Camera, Permissions } from 'expo';
import axios from 'axios';



export default class HomeScreen extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      cardName: '',
      cardId: '',
      cards: [],
      searchError: {},
      hasCameraPermission: null,
      type: Camera.Constants.Type.back,
      snapped: false,
      photoUri: '',
      tradeList: [],
      cameraView: true
    }
  }

  async componentDidMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ hasCameraPermission: status === 'granted' });
  }


  static navigationOptions = {
    header: null,
  };


  snap = async () => {
    if (this.camera) {
      try {
        let photo = await this.camera.takePictureAsync({ base64: true, quality: 0 });
        var form = new FormData();
        form.append("language", "eng");
        form.append("isOverlayRequired", "false");
        form.append("base64image", `data:image/jpg;base64,${photo.base64}`);
        form.append("iscreatesearchablepdf", "false");
        form.append("issearchablepdfhidetextlayer", "false");
        form.append("filetype", "jpg");

        var headers = {
          "headers": {
            "apikey": "371fa6e54588957",
            "cache-control": "no-cache",
            "Postman-Token": "51cd2ccb-9bba-4d04-8eb0-279c22aa9e33"
          }
        }

        const response = await axios.post('https://api.ocr.space/parse/image', form, headers)
        let cardName = ''
        let text = ''
        if(response.data.ParsedResults.length) {
          text = response.data.ParsedResults[0].ParsedText;
          cardName = text.split('\n')[0]
        }
        this.setState({
          snapped: true,
          photoUri: photo.uri,
          text: text,
          cardName
        })
      } catch (error) {
        alert(error)
        console.log(error)
      }
    }
  };

  render() {
    const { hasCameraPermission } = this.state;
    if (this.state.cardName.length) {
      this.searchCardByName(this.state.cardName)
    }
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          {/* <View style={{ padding: 10 }}>
            <Text>SEARCH BY:</Text>
            <TextInput
              style={{ height: 40 }}
              placeholder="CARD NAME"
              onChangeText={(cardName) => this.setState({ cardName })}
              onSubmitEditing={this.searchCardByName}
            />
            <Text>OR</Text>
            <TextInput
              style={{ height: 40 }}
              placeholder="CARD ID"
              onChangeText={(cardId) => this.setState({ cardId })}
              onSubmitEditing={this.searchCardById}
            />
          </View> */}
          <View>
            <Text>Found {this.state.cards.length} Cards:</Text>
            {
              this.state.cards.length
                ? this.state.cards.map(card => (
                  <View key={card.id}>
                    <Text>{card.name}</Text>
                    <Text>Price: {card.usd}</Text>
                    {
                      card.image_uris
                        ? <Image source={{ uri: `${card.image_uris.png}` }}
                          style={{ width: 125, height: 175 }} />
                        : <Image source={{ uri: `${card.card_faces[0].image_uris.png}` }}
                          style={{ width: 125, height: 175 }} />

                    }
                    <Button
                      onPress={() => {
                        this.setState({
                          tradeList: [...this.state.tradeList, card]
                        });
                      }}
                      title="Add to trade"
                      style={{ width: 125, height: 15 }}
                    />
                  </View>
                ))
                : <Text>No cards named {this.state.cardName} found.</Text>
            }
          </View>

        </ScrollView>
        {
          this.state.cameraView
            ? <View>
              <Camera style={{ width: 500, height: 300 }} type={this.state.type} pictureSize={"640x480"} ref={ref => { this.camera = ref; }}>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    flexDirection: 'row',
                  }}>
                  <TouchableOpacity
                    style={{
                      flex: 0.4,
                      alignSelf: 'flex-end',
                      alignItems: 'center',
                    }}
                    onPress={this.snap}>
                    <Text
                      style={{ fontSize: 18, marginBottom: 10, color: 'white' }}>
                      Find Card
                  </Text>
                  </TouchableOpacity>
                </View>
              </Camera>
            </View>
            : <View>
              <Text>Current Trade List:</Text>
              {
                this.state.tradeList.map((card, idx) => {
                  return (

                    <TouchableOpacity
                      key={`card${idx}`}
                      style={{ margin: 5 }}
                      onPress={() => {
                        let newList = this.state.tradeList
                        console.log(newList)
                        newList.splice(idx, 1)
                        console.log(newList)
                        this.setState({
                          tradeList: newList
                        })
                      }}>
                      <Text key={`cardText${idx}`}>{card.name}: ${card.usd}</Text>
                    </TouchableOpacity>
                  )
                }
                )
              }
              <Text>Total value: ${this.state.tradeList.reduce((total, card) => { return total + +card.usd }, 0).toFixed(2)}</Text>
            </View>
        }
        <View>
          {
            !this.state.cameraView
              ? <Button
                onPress={() => {
                  this.setState({
                    cameraView: true
                  });
                }}
                title="CAMERA"
                style={{ width: 125, height: 15 }}
              />
              : <Button
                onPress={() => {
                  this.setState({
                    cameraView: false
                  });
                }}
                title="VIEW TRADE LIST"
                style={{ width: 125, height: 15 }}
              />
          }


        </View>
      </View>
    );
  }

  async searchCardByName() {
    try {
      const { data: cards } = await axios.get(`https://api.scryfall.com/cards/search?q=${this.state.cardName}`)
      this.setState({ cards: cards.data })
    } catch (err) {
      console.log(err)
    }
  }

  async searchCardById() {
    try {
      const { data: card } = await axios.get(`https://api.scryfall.com/cards/multiverse/${this.state.cardId}`)
      this.setState({ cards: [...cards, card] })
    } catch (err) {
      console.error(err)
    }
  }

  _maybeRenderDevelopmentModeWarning() {
    if (__DEV__) {
      const learnMoreButton = (
        <Text onPress={this._handleLearnMorePress} style={styles.helpLinkText}>
          Learn more
        </Text>
      );

      return (
        <Text style={styles.developmentModeText}>
          Development mode is enabled, your app will be slower but you can use useful development
          tools. {learnMoreButton}
        </Text>
      );
    } else {
      return (
        <Text style={styles.developmentModeText}>
          You are not in development mode, your app will run at full speed.
        </Text>
      );
    }
  }

  _handleLearnMorePress = () => {
    WebBrowser.openBrowserAsync('https://docs.expo.io/versions/latest/guides/development-mode');
  };

  _handleHelpPress = () => {
    WebBrowser.openBrowserAsync(
      'https://docs.expo.io/versions/latest/guides/up-and-running.html#can-t-see-your-changes'
    );
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  developmentModeText: {
    marginBottom: 20,
    color: 'rgba(0,0,0,0.4)',
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'center',
  },
  contentContainer: {
    paddingTop: 30,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  welcomeImage: {
    width: 100,
    height: 80,
    resizeMode: 'contain',
    marginTop: 3,
    marginLeft: -10,
  },
  getStartedContainer: {
    alignItems: 'center',
    marginHorizontal: 50,
  },
  homeScreenFilename: {
    marginVertical: 7,
  },
  codeHighlightText: {
    color: 'rgba(96,100,109, 0.8)',
  },
  codeHighlightContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 3,
    paddingHorizontal: 4,
  },
  getStartedText: {
    fontSize: 17,
    color: 'rgba(96,100,109, 1)',
    lineHeight: 24,
    textAlign: 'center',
  },
  tabBarInfoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      ios: {
        shadowColor: 'black',
        shadowOffset: { height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 20,
      },
    }),
    alignItems: 'center',
    backgroundColor: '#fbfbfb',
    paddingVertical: 20,
  },
  tabBarInfoText: {
    fontSize: 17,
    color: 'rgba(96,100,109, 1)',
    textAlign: 'center',
  },
  navigationFilename: {
    marginTop: 5,
  },
  helpContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  helpLink: {
    paddingVertical: 15,
  },
  helpLinkText: {
    fontSize: 14,
    color: '#2e78b7',
  },
});
