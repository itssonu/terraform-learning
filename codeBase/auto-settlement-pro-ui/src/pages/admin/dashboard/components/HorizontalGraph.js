import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import '../../style.css';
import 'react-datepicker/dist/react-datepicker.css';

const HorizontalGraph = ({ dataPoints, totalNumCases, graph, MPoints, yAxisLabel = 'Users', handleOpenFirmDashboard }) => {

    const chartRef = useRef();

    useEffect(() => {
        drawChart();
        console.log(dataPoints, MPoints, "Mdata");
    }, [MPoints, dataPoints]);

    const drawChart = () => {

        if (!dataPoints || dataPoints.length === 0) return;
        const width = 400;
        const height = dataPoints.length * 50;
        const margin = { top: 100, right: 50, bottom: 30, left: 100 };
        const labelToDomainMap = Object.fromEntries(dataPoints.map(d => [d.label, d.domainName]));
        d3.select(chartRef.current).selectAll("*").remove(); // Clear previous SVG content

        const svg = d3.select(chartRef.current)
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        const xScale = d3.scaleLinear()
            .domain([0, d3.max(dataPoints, d => d.y) || 1])
            .range([0, width]);
        const yScale = d3.scaleBand()
            .domain(dataPoints.map(d => d.label))
            .range([0, height])
            .padding(0.6); // Increased padding for more gap

        const yAxis = svg.append("g")
            .call(d3.axisLeft(yScale).tickSize(0).tickPadding(5));

        yAxis.select(".domain").remove();

        yAxis.selectAll("text")
            .style("cursor", "pointer")
            .on("click", (event, d) => {
                if(handleOpenFirmDashboard){
                    const domainName = labelToDomainMap[d];
                    if (domainName) {
                        const modifiedDomainName = extractDbName(domainName);
                        handleOpenFirmDashboard(modifiedDomainName);
                    } else {
                        console.warn("No domainName found for label:", d);
                    }
                }
            });

        // Define gradient
        const defs = svg.append("defs");
        const gradient = defs.append("linearGradient")
            .attr("id", "barGradient")
            .attr("x1", "0%")  // Start from left
            .attr("x2", "100%") // End at right
            .attr("y1", "0%")  // Slight diagonal effect
            .attr("y2", "100%");

        // Define color stops based on your UI
        gradient.append("stop").attr("offset", "2%").attr("stop-color", "#06F8E3");  // Cyan start
        gradient.append("stop").attr("offset", "34%").attr("stop-color", "#2C93E8"); // Mid soft blue
        gradient.append("stop").attr("offset", "100%").attr("stop-color", "#0A3381"); // Deep blue end

        // Draw bars with only the right side rounded
        svg.selectAll(".bar")
            .data(dataPoints)
            .enter()
            .append("path")
            .attr("d", d => {
                const barWidth = xScale(d.y);
                const barHeight = yScale.bandwidth() * 0.7; // Reduced height
                const radius = 5; // Rounded corner radius

                return `
                        M 0,0 
                        H ${barWidth - radius} 
                        A ${radius},${radius} 0 0 1 ${barWidth},${radius} 
                        V ${barHeight - radius} 
                        A ${radius},${radius} 0 0 1 ${barWidth - radius},${barHeight} 
                        H 0 
                        Z
                    `;
            })
            .attr("transform", d => `translate(0,${yScale(d.label)})`)
            .attr("fill", "url(#barGradient)");

        // Add labels on bars
        svg.selectAll(".text")
            .data(dataPoints)
            .enter()
            .append("text")
            .attr("x", d => xScale(d.y) + 5)
            .attr("y", d => yScale(d.label) + yScale.bandwidth() / 1.5) // Adjusted label position
            .attr("fill", "#333")
            .attr("font-size", "14px")
            .attr("font-weight", "normal")
            .text(d => d.y);

        // Add X Axis Labels (remove axis lines)
        const xAxis = svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).ticks(7).tickSize(7)); // No tick lines
        xAxis.select(".domain").remove(); // Remove the X-axis line

    };

    const extractDbName = (domain) => {
        return domain.split('.')[0];
    }

    return (
        <>
            <div style={{ paddingTop: '20px', textAlign: "center", paddingBottom: '20px' }}>
                <svg ref={chartRef}></svg>
            </div>
        </>
    );
};

export default HorizontalGraph;