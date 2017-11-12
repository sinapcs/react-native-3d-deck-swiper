/**
 * Created by sina on 11/7/17.
 */
import React, { Component } from "react";
import PropTypes from "prop-types";
import { View, Animated, PanResponder } from "react-native";
import clamp from "clamp";
const SWIPE_THRESHOLD = 120;

class DeckSwiper extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pan: new Animated.ValueXY(),
      pan2: new Animated.ValueXY(),
      enter: new Animated.Value(0.9),
      selectedItem: this.props.dataSource[0],
      selectedItem2: this.props.dataSource[1],
      card1Top: true,
      card2Top: false,
      fadeAnim: new Animated.Value(0.6),
      fadeAnim2: new Animated.Value(0.4),
      looping: typeof this.props.looping === "undefined" ? true : this.props.looping,
      disabled: this.props.dataSource.length === 0,
      lastCard: this.props.dataSource.length === 1,
    };
  }

  componentWillReceiveProps({ dataSource }) {
    if (dataSource.length !== this.props.dataSource.length) {
      if (dataSource.length <= 1) {
        this.setState({
          ...this.state,
          selectedItem: dataSource[0],
          selectedItem2: undefined,
          disabled: dataSource.length === 0,
          lastCard: dataSource.length === 1,
        });
        return;
      }

      const visibleIndex = dataSource.indexOf(this.state.selectedItem);
      const currentIndex = visibleIndex < 0 ? visibleIndex + 1 : visibleIndex;
      const nextIndex = currentIndex + 1 === dataSource.length ? 0 : currentIndex + 1;

      this.setState({
        selectedItem: dataSource[currentIndex],
        selectedItem2: dataSource[nextIndex],
      });
    }
  }

  getInitialStyle() {
    return {
      topCard: {
        position: "absolute",
        top: 0,
        right: 0,
        left: 0,
      },
    };
  }

  findNextIndexes(currentIndex) {
    const newIdx = currentIndex + 1;
    const newIdx2 = currentIndex + 2;

    if (newIdx2 > this.props.dataSource.length - 1 && newIdx === this.props.dataSource.length - 1) {
      return [newIdx, 0];
    } else if (newIdx > this.props.dataSource.length - 1) {
      return [0, 1];
    }
    return [newIdx, newIdx2];
  }

  selectNext() {
    const dataSource = this.props.dataSource;
    const currentIndex = dataSource.indexOf(this.state.selectedItem);

    // if not looping, check for these conditionals and if true return from selectNext()
    if (!this.state.looping) {
      // reached end -> only display static renderEmpty() -> no swiping
      if (currentIndex === dataSource.length - 1) {
        return this.setState({
          disabled: true,
        });
      } else if (currentIndex === dataSource.length - 2) {
        // show last card with renderEmpty() component behind it
        return setTimeout(() => {
          this.setState({
            selectedItem: dataSource[currentIndex + 1],
          });
          setTimeout(() => {
            this.setState({
              lastCard: true,
            });
          }, 350);
        }, 50);
      }
    }

    const nextIndexes = this.findNextIndexes(currentIndex);
    setTimeout(() => {
      this.setState({
        selectedItem: this.props.dataSource[nextIndexes[0]],
      });
      setTimeout(() => {
        this.setState({
          selectedItem2: this.props.dataSource[nextIndexes[1]],
        });
      }, 350);
    }, 50);
  }

  swipeRight() {
    if (this.props.onSwiping) this.props.onSwiping("right");
    setTimeout(() => {
      Animated.timing(this.state.fadeAnim, { toValue: 1 }).start();
      Animated.spring(this.state.enter, { toValue: 1, friction: 7 }).start();
      this.selectNext();
      Animated.decay(this.state.pan, {
        velocity: { x: 5, y: 1 },
        deceleration: 0.98,
      }).start(this._resetState.bind(this));
    }, 0);
  }

  swipeLeft() {
    if (this.props.onSwiping) this.props.onSwiping("left");
    setTimeout(() => {
      Animated.timing(this.state.fadeAnim, { toValue: 1 }).start();
      Animated.spring(this.state.enter, { toValue: 1, friction: 7 }).start();
      this.selectNext();
      Animated.decay(this.state.pan, {
        velocity: { x: -5, y: 1 },
        deceleration: 0.98,
      }).start(this._resetState.bind(this));
    }, 0);
  }

  componentWillMount() {
    this._panResponder = PanResponder.create({
      onMoveShouldSetResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => Math.abs(gestureState.dx) > 5,

      onPanResponderGrant: (e, gestureState) => {
        this.state.pan.setOffset({
          x: this.state.pan.x._value,
          y: this.state.pan.y._value,
        });
        this.state.pan.setValue({ x: 0, y: 0 });
      },

      onPanResponderMove: (e, gestureState) => {
        if (gestureState.dx > 20) {
          if (this.props.onSwiping) this.props.onSwiping("right", gestureState.dx);
        } else if (gestureState.dx < -20) {
          if (this.props.onSwiping) this.props.onSwiping("left", gestureState.dx);
        }
        let val = Math.abs(gestureState.dx * 0.0013);
        const opa = Math.abs(gestureState.dx * 0.0022);
        if (val > 0.1) {
          val = 0.1;
        }
        Animated.timing(this.state.fadeAnim, { toValue: 0.9 + val }).start();
        Animated.spring(this.state.enter, {
          toValue: 0.9 + val,
          friction: 7,
        }).start();
        Animated.event([null, { dx: this.state.pan.x }])(e, gestureState);
      },

      onPanResponderRelease: (e, { vx, vy }) => {
        if (this.props.onSwiping) this.props.onSwiping(null);
        let velocity;

        if (vx >= 0) {
          velocity = clamp(vx, 4.5, 10);
        } else if (vx < 0) {
          velocity = clamp(vx * -1, 4.5, 10) * -1;
        }

        if (Math.abs(this.state.pan.x._value) > SWIPE_THRESHOLD) {
          if (velocity > 0) {
            this.props.onSwipeRight ? this.props.onSwipeRight(this.state.selectedItem) : undefined;
            this.selectNext();
          } else {
            this.props.onSwipeLeft ? this.props.onSwipeLeft(this.state.selectedItem) : undefined;
            this.selectNext();
          }

          Animated.decay(this.state.pan, {
            velocity: { x: velocity, y: vy },
            deceleration: 0.98,
          }).start(this._resetState.bind(this));
        } else {
          Animated.spring(this.state.enter, {
            toValue: 0.9 ,
            friction: 7,
          }).start();
          Animated.spring(this.state.pan, {
            toValue: { x: 0, y: 0 },
            friction: 4,
          }).start();
        }
      },
    });
  }

  _resetState() {
    this.state.pan.setValue({ x: 0, y: 0 });
    this.state.pan2.setValue({ x: 0, y: -10 });
    this.state.enter.setValue(0.9);
    this.state.fadeAnim.setValue(0.6);
    this.setState({
      card1Top: !this.state.card1Top,
      card2Top: !this.state.card2Top,
    });
    if (this.props.onSwiping) this.props.onSwiping(null);
  }

  getCardStyles() {
    const { pan, pan2, enter } = this.state;

    const [translateX, translateY] = [pan.x, pan.y];
    // let [translateX, translateY] = [pan2.x, pan2.y];

    const rotate = pan.x.interpolate({
      inputRange: [-700, 0, 700],
      outputRange: ["-300deg", "0deg", "300deg"],
    });

    const opacity = pan.x.interpolate({
      inputRange: [-320, 0, 320],
      outputRange: [0.9, 1, 0.9],
    });
    const scale = enter;
    const scale2 = enter.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.9]
      }
    )

    const translateY2 = pan.x.interpolate({
      inputRange: [-700, 0, 700],
      outputRange: [0, -30, 0],
    });
    const translateY3 = pan.x.interpolate({
      inputRange: [-700, 0, 700],
      outputRange: [0, -60, 0],
    });

    const animatedCardStyles = {
      transform: [{ translateX }, { translateY }, { rotate }],
      opacity,
    };

    const animatedCardStyles2 = { transform: [{ scale },{translateY:translateY2}] };

    const animatedCardStyles3 = { transform: [{ scale:scale2 },{translateY:translateY3}] };

    return [animatedCardStyles, animatedCardStyles2, animatedCardStyles3];
  }

  render() {
    if (this.state.disabled) {
      // disable swiping and renderEmpty
      return (
        <View style={{ position: "relative", flexDirection: "column" }}>
          {
            <View>
              {this.props.renderEmpty && this.props.renderEmpty()}
            </View>
          }
        </View>
      );
    } else if (this.state.lastCard) {
      // display renderEmpty underneath last viable card
      return (
        <View style={{ position: "relative", flexDirection: "column" }}>
          {this.state.selectedItem === undefined
            ? <View />
            : <View>
              <Animated.View
                style={[
                  this.getCardStyles()[1],
                  this.getInitialStyle().topCard,
                  { opacity: this.state.fadeAnim },
                ]}
                {...this._panResponder.panHandlers}
              >
                {this.props.renderEmpty && this.props.renderEmpty()}
              </Animated.View>
              <Animated.View
                style={[this.getCardStyles()[0], this.getInitialStyle().topCard]}
                {...this._panResponder.panHandlers}
              >
                {this.props.renderItem(this.state.selectedItem)}
              </Animated.View>
            </View>}
        </View>
      );
    }
    return (
      <View style={{ position: "relative", flexDirection: "column" }}>
        {this.state.selectedItem === undefined
          ? <View />
          : <View>
            <Animated.View
              style={[
                this.getCardStyles()[2],
                this.getInitialStyle().topCard,
                { opacity: this.state.fadeAnim2 },
              ]}
              {...this._panResponder.panHandlers}
            >
              {this.props.renderBottom
                ? this.props.renderBottom(this.state.selectedItem2)
                : this.props.renderItem(this.state.selectedItem2)}
            </Animated.View>
            <Animated.View
              style={[
                this.getCardStyles()[1],
                this.getInitialStyle().topCard,
                { opacity: this.state.fadeAnim },
              ]}
              {...this._panResponder.panHandlers}
            >
              {this.props.renderBottom
                ? this.props.renderBottom(this.state.selectedItem2)
                : this.props.renderItem(this.state.selectedItem2)}
            </Animated.View>
            <Animated.View
              style={[
                this.getCardStyles()[0],
                this.getInitialStyle().topCard]}
              {...this._panResponder.panHandlers}
            >
              {this.props.renderTop
                ? this.props.renderTop(this.state.selectedItem)
                : this.props.renderItem(this.state.selectedItem)}
            </Animated.View>
          </View>}
      </View>
    );
  }
}

export default DeckSwiper;
