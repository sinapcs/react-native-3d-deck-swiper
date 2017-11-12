# react-native-3d-deck-swiper

you need just import DeckSwiper and use it like this:

    import React,{Component} from 'react'
    import {
      View,
      Text,
      StyleSheet,
    } from 'react-native'
    import {
      colors,
    } from '../../constants/AppConstants'
    import DeckSwiper from '../DeckSwiper';

    const cards = [
      {
        text: 'Card 1'
      },
      {
        text: 'Card 2'
      },
      {
        text: 'Card 3'
      },
      {
        text: 'Card 4'
      }
    ];

    export default class Example extends Component {

      renderItem = (item) =>
          <View style={styles.card}>
            <View>
              <Text>{item.text}</Text>
              <Text note>NativeBase</Text>
            </View>
          </View>


      render() {
        // inside your render function
        return (
          <View style={styles.container}>
            <View style={{flex:1,alignItems:'center'}}>
              <Text onPress={() => this._deckSwiper.swipeLeft()}>
                Prev
              </Text>
            </View>
            <View style={{flex:5}}>
              <DeckSwiper
                ref={(c) => this._deckSwiper = c}
                dataSource={cards}
                renderItem={this.renderItem}
              />
            </View>
            <View style={{flex:1,alignItems:'center'}}>
              <Text onPress={() => this._deckSwiper.swipeRight()}>
                Next
              </Text>
            </View>
          </View>
        );
      }
    }

    const styles = StyleSheet.create({

      container:{
        flex:1,
        flexDirection:'row',
        marginTop:50
      },
      card: {
        margin:'10%',
        height:200,
        backgroundColor:colors.second,
        elevation: 3,
        justifyContent:'center',
        alignItems:'center'
      }
    });
