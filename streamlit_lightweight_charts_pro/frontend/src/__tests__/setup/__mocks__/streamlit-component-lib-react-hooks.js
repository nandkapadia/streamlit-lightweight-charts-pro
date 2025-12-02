/**
 * Mock for streamlit-component-lib-react-hooks
 * Provides Jest-compatible mocks for Streamlit React hooks
 */
/* global jest */

const useRenderData = jest.fn(() => ({
  args: {
    config: {
      charts: [
        {
          chartId: 'test-chart',
          chart: {
            height: 400,
            autoSize: true,
            layout: {
              color: '#ffffff',
              textColor: '#000000',
            },
          },
          series: [],
          annotations: {
            layers: {},
          },
        },
      ],
      sync: {
        enabled: false,
        crosshair: false,
        timeRange: false,
      },
    },
    height: 400,
    width: null,
  },
  disabled: false,
  height: 400,
  width: 800,
  theme: {
    base: 'light',
    primaryColor: '#ff4b4b',
    backgroundColor: '#ffffff',
    secondaryBackgroundColor: '#f0f2f6',
    textColor: '#262730',
  },
}));

const StreamlitProvider = ({ children }) => children;

// eslint-disable-next-line no-undef
module.exports = {
  useRenderData,
  StreamlitProvider,
};
