import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import '../../style.css';
import 'react-datepicker/dist/react-datepicker.css';


const data = [
    { name: "SEPT", value: 11 },
    { name: "OCT", value: 15 },
    { name: "NOV", value: 40 },
    { name: "DEC", value: 58 },
    { name: "JAN", value: 0 },
    { name: "FEB", value: 0 },
    { name: "MARCH", value: 0 },
    { name: "APRIL", value: 0 },
    { name: "MAY", value: 0 },
    { name: "JUNE", value: 0 },
    { name: "JULY", value: 0 },
    { name: "AUG", value: 0 }
];

const VerticalGraph = ({ dataPoints, totalNumCases, graph, MPoints, yAxisLabel = 'Users' }) => {

    const chartRef = useRef();

    useEffect(() => {
        drawChart();
        console.log(dataPoints, MPoints, "Mdata");
    }, [MPoints, dataPoints]);

    const drawChart = () => {

        const width = 500;
        const height = 450;
        const margin = { top: 20, right: 30, bottom: 80, left: 50 };

        d3.select(chartRef.current).selectAll("*").remove();

        const svg = d3.select(chartRef.current)
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        const xScale = d3.scaleBand()
            .domain(dataPoints.map(d => d.label))
            .range([0, width])
            .padding(0.1); // More spacing between bars

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(dataPoints, d => d.value) + 20])
            .range([height, 0]);

        // Define gradient
        const defs = svg.append("defs");
        const gradient = defs.append("linearGradient")
            .attr("id", "barGradient")
            .attr("x1", "0%")
            .attr("x2", "100%")
            .attr("y1", "0%")
            .attr("y2", "100%");

        gradient.append("stop").attr("offset", "2%").attr("stop-color", "#06F8E3");  // Cyan start
        gradient.append("stop").attr("offset", "34%").attr("stop-color", "#2C93E8"); // Mid soft blue
        gradient.append("stop").attr("offset", "100%").attr("stop-color", "#0A3381"); // Deep blue end

        svg.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(yScale)
                .tickSize(-width)
                .tickFormat(d => d)
            )
            .selectAll("line")
            .attr("stroke", "#ddd")
            .attr("stroke-width", 1)
            .attr("shape-rendering", "crispEdges");

        // **Remove Y-Axis Line**
        svg.select(".grid .domain").remove();

        // Draw bars (shorter width)
        svg.selectAll(".bar")
            .data(dataPoints)
            .enter()
            .append("rect")
            .attr("x", d => xScale(d.label) + xScale.bandwidth() * 0.25) // Centered with smaller width
            .attr("y", d => yScale(d.value))
            .attr("width", xScale.bandwidth() * 0.3) // Decreased width
            .attr("height", d => height - yScale(d.value))
            .attr("fill", "url(#barGradient)")
            .attr("rx", 10) // Rounded top
            .attr("ry", d => (d.value > 0 ? 10 : 0)); // Flat bottom

        // Add value labels above bars
        svg.selectAll(".text")
            .data(dataPoints)
            .enter()
            .append("text")
            .attr("x", d => xScale(d.label) + xScale.bandwidth() / 2)
            .attr("y", d => (d.value > 0 ? yScale(d.value) - 5 : yScale(d.value) + 15)) // Adjust if value is 0
            .attr("fill", "#333")
            .attr("font-size", "14px")
            .attr("font-weight", "normal")
            .attr("text-anchor", "middle")
            .text(d => (d.value > 0 ? d.value : "")); // Show only if value > 0

        // Add X Axis Labels (KEEP Labels, Remove Axis Line)
        const xAxis = svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).tickSize(0).tickPadding(15));

        // **Remove X-Axis Line but Keep Labels**
        xAxis.select(".domain").remove();

        xAxis.selectAll("text")
            .style("text-anchor", "middle")
            .attr("dy", "10px")
            .attr("font-size", "12px")
            .attr("fill", "#666");

        // **Ensure Y-Axis Labels (10, 20, 30, etc.) Stay Visible**
        svg.append("g")
            .call(d3.axisLeft(yScale).tickSize(0)) // Keep tick labels
            .select(".domain").remove(); // Remove Y-axis line

        // if (graph) {
        //     const svg = d3.select(chartRef.current);
        //     svg.selectAll("*").remove();
        //     const margin = { top: 50, right: 50, bottom: 150, left: 300 };
        //     const width = 1600 - margin.left - margin.right;
        //     const height = Math.max(400, (dataPoints.length * 40)) - margin.top - margin.bottom;
        //     const chart = svg
        //         .attr("width", width + margin.left + margin.right)
        //         .attr("height", height + margin.top + margin.bottom)
        //         .append("g")
        //         .attr("transform", `translate(${margin.left},${margin.top})`);

        //     const x = d3.scaleLinear()
        //         .domain([0, d3.max(dataPoints, d => d.y)])
        //         .nice()
        //         .range([0, width]);

        //     const y = d3.scaleBand()
        //         .domain(dataPoints.map(d => d.label))
        //         .range([height, 0])
        //         .padding(0.3);

        //     chart.append("g")
        //         .attr("class", "x-axis")
        //         .attr("transform", `translate(0,${height})`)
        //         .call(d3.axisBottom(x)
        //             .ticks(d3.max(dataPoints, d => d.y) > 20 ? undefined : d3.max(dataPoints, d => d.y))
        //             .tickFormat(d3.format("d"))
        //             .tickSize(-height)
        //             .tickPadding(10)
        //         )
        //         .selectAll("text")
        //         .style("font-weight", "bold")
        //         .style("font-size", "14px");

        //     chart.select(".x-axis .domain").style("display", "none");
        //     chart.append("g")
        //         .attr("class", "y-axis")
        //         .call(d3.axisLeft(y)
        //             .tickSize(-width)
        //         )
        //         .call(d3.axisLeft(y))
        //         .selectAll("text")
        //         .style("font-weight", "bold")
        //         .style("font-size", "14px");

        //     chart.selectAll(".bar")
        //         .data(dataPoints)
        //         .enter()
        //         .append("rect")
        //         .attr("class", "bar")
        //         .attr("x", 0)
        //         .attr("y", d => y(d.label))
        //         .attr("width", d => x(d.y))
        //         .attr("height", y.bandwidth())
        //         .attr("fill", "#18479A");

        //     chart.selectAll(".label")
        //         .data(dataPoints)
        //         .enter()
        //         .append("text")
        //         .attr("class", "label")
        //         .attr("x", d => x(d.y) + 5)
        //         .attr("y", d => y(d.label) + y.bandwidth() / 2)
        //         .attr("dy", ".35em")
        //         .attr("text-anchor", "start")
        //         .style("font-weight", "bold")
        //         .text(d => d.y);

        //     chart.append("text")
        //         .attr("class", "y-axis-label")
        //         .attr("transform", "rotate(-90)")
        //         .attr("x", -height / 2)
        //         .attr("y", -margin.left + 20)
        //         .attr("text-anchor", "middle")
        //         .attr("font-size", "23px")
        //         .attr("font-weight", "bold")
        //         .text(yAxisLabel);

        //     chart.append("text")
        //         .attr("class", "x-axis-label")
        //         .attr("x", width / 2)
        //         .attr("y", height + margin.bottom)
        //         .attr("text-anchor", "middle")
        //         .attr("font-size", "23px")
        //         .attr("font-weight", "bold")
        //         .text(`Number of Demands Created: ${totalNumCases}`);
        //     } else {
        //         const allZero = MPoints.every(d => d.value === 0);
        //         const svg = d3.select(chartRef.current);
        //         svg.selectAll("*").remove();
        //         const margin = { top: 20, right: 30, bottom: 50, left: 150 };
        //         const width = 1850 - margin.left - margin.right;
        //         const height = 500 - margin.top - margin.bottom;
        //         const chart = svg
        //             .attr("width", width + margin.left + margin.right)
        //             .attr("height", height + margin.top + margin.bottom)
        //             .append("g")
        //             .attr("transform", `translate(${margin.left},${margin.top})`);

        //         // Calculate max value for scaling
        //         const maxValue = d3.max(MPoints, d => d.value);

        //         const x = d3.scaleBand()
        //         .domain(MPoints.map(d => d.label))
        //             .range([1, width])
        //             .padding(0.1);

        //         const y = d3.scaleLinear()
        //             .domain([0, maxValue])
        //             .nice()
        //             .range([height, 0]);

        //         // Append a single grid line at the bottom of the y-axis
        //         chart.append("line")
        //             .attr("class", "bottom-grid-line")
        //             .attr("x1", 0)
        //             .attr("y1", height)
        //             .attr("x2", width)
        //             .attr("y2", height)
        //             .attr("stroke", "black")  // Change to a darker color for bold effect
        //             .attr("stroke-width",0.7); 

        //         // Append bars to the chart
        //         if (!allZero) {
        //             const bars = chart.selectAll(".bar")
        //                 .data(MPoints)
        //                 .enter()
        //                 .append("g")
        //                 .attr("class", "bar")
        //                 .attr("transform", d => `translate(${x(d.label)}, 0)`);

        //             bars.append("rect")
        //                 .attr("y", d => y(d.value))
        //                 .attr("height", d => height - y(d.value))
        //                 .attr("width", x.bandwidth())
        //                 .attr("fill", "#18479A");

        //             bars.append("text")
        //                 .attr("class", "label")
        //                 .attr("x", x.bandwidth() / 2)
        //                 .attr("y", d => y(d.value) - 5)
        //                 .attr("text-anchor", "middle")
        //                 .style("font-weight", "bold")
        //                 .text(d => d.value);
        //         }


        //         // Append x-axis to the chart
        //         chart.append("g")
        //             .attr("class", "x-axis")
        //             .attr("transform", `translate(0,${height})`)
        //             .call(d3.axisBottom(x))
        //             .selectAll("text")
        //             .style("text-anchor", "middle") 
        //             .style("font-weight", "bold")
        //             .style("font-size", "14px");

        //         chart.select(".x-axis .domain").style("display", "none");

        //         // Append y-axis to the chart
        //         chart.append("g")
        //             .attr("class", "y-axis")
        //             .call(d3.axisLeft(y)
        //                 .ticks(maxValue > 10 ? 10 : maxValue)
        //                 .tickFormat(d3.format("d"))
        //             )
        //             .selectAll("text")
        //             .style("font-weight", "bold")
        //             .style("font-size", "14px");

        //         // Append x-axis label
        //         chart.append("text")
        //             .attr("class", "x-axis-label")
        //             .attr("x", width / 2)
        //             .attr("y", height + margin.bottom)
        //             .attr("text-anchor", "middle")
        //             .attr("font-size", "23px")
        //             .attr("font-weight", "bold")
        //             .text("Months");

        //         // Append y-axis label
        //         chart.append("text")
        //             .attr("class", "y-axis-label")
        //             .attr("x", -height / 2)
        //             .attr("y",  -40)
        //             .attr("transform", "rotate(-90)")
        //             .attr("text-anchor", "middle")
        //             .attr("font-size", "23px")
        //             .attr("font-weight", "bold")
        //             .text(`Number of Demands`);
        //     }
    };
    const handleDateChange = (range) => {
        console.log("Selected Range:", range);
    };
    return (
        <>
            <div style={{ paddingTop: '20px', textAlign: "center", paddingBottom: '20px' }}>
                <svg ref={chartRef} width="1000" height="400"></svg>
            </div>
        </>
    );
};

export default VerticalGraph;