/**
 * Mock for streamlit-component-lib
 * Provides Jest-compatible mocks for Streamlit functionality
 */
/* global jest */

const Streamlit = {
  setComponentValue: jest.fn(),
  setFrameHeight: jest.fn(),
  setComponentReady: jest.fn(),
  RENDER_EVENT: 'streamlit:render',
  SET_FRAME_HEIGHT_EVENT: 'streamlit:setFrameHeight',
};

const StreamlitComponentBase = class {
  constructor(props) {
    this.props = props;
  }

  render() {
    return null;
  }
};

const withStreamlitConnection = component => component;

// eslint-disable-next-line no-undef
module.exports = {
  Streamlit,
  StreamlitComponentBase,
  withStreamlitConnection,
};
