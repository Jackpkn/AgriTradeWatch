// import React, { useMemo } from 'react';
// import { View, StyleSheet } from 'react-native';
// import { VictoryChart, VictoryCandlestick, VictoryTheme } from 'victory-native';
// import { min, max, median, quantile } from 'd3-array';

// export default BoxPlot = ({ data }) => {
//   // Calculate statistics using d3
//   const stats = useMemo(() => {
//     const sortedData = [...data].sort((a, b) => a - b); // Sort the data
//     return {
//       min: min(sortedData),
//       max: max(sortedData),
//       q1: quantile(sortedData, 0.25),
//       median: median(sortedData),
//       q3: quantile(sortedData, 0.75),
//     };
//   }, [data]);

//   // Process the data for VictoryCandlestick
//   const processedData = useMemo(() => {
//     return [
//       {
//         x: "Prices", // Single category
//         low: stats.min,
//         high: stats.max,
//         open: stats.q1,
//         close: stats.q3,
//       },
//     ];
//   }, [stats]);

//   return (
//     <View style={styles.container}>
//       <VictoryChart
//         theme={VictoryTheme.material}
//         domainPadding={{ x: 50, y: 10 }}
//         padding={{ top: 20, bottom: 50, left: 50, right: 50 }}
//       >
//         <VictoryCandlestick
//           data={processedData}
//           candleColors={{ positive: "lightblue", negative: "lightblue" }}
//           style={{
//             data: {
//               stroke: "black", // Box and whisker stroke
//               strokeWidth: 1.5,
//             },
//           }}
//         />
//       </VictoryChart>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#f5f5f5",
//   },
// });
