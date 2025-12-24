import { Controller } from "@hotwired/stimulus"
import * as d3 from "d3"
import * as topojson from "topojson-client"

export default class extends Controller {
  static values = { data: Array }

  connect() {
    console.log("Map connected", this.dataValue, typeof this.dataValue)
    this.renderMap()
  }

  renderMap() {
    console.log("Rendering map")
    const data = this.dataValue
    console.log("Data:", data)
    const width = 960
    const height = 500

    const svg = d3.select(this.element)
      .append("svg")
      .attr("width", width)
      .attr("height", height)

    const projection = d3.geoNaturalEarth1()
      .scale(width / 1.3 / Math.PI)
      .translate([width / 2, height / 2])

    const path = d3.geoPath().projection(projection)

    d3.json("/ne_countries_admin_0.geojson").then(geojson => {
      svg.append("g")
        .selectAll("path")
        .data(geojson.features)
        .enter().append("path")
        .attr("d", path)
        .attr("fill", d => {
          // Try to match by ISO code or name
          let country = data.find(c => c.iso_code && (c.iso_code === d.properties["ISO3166-1-Alpha-3"] || c.iso_code === d.properties["ISO3166-1-Alpha-2"]))
          if (!country) {
            country = data.find(c => c.name === d.properties.name)
          }
          
          if (country && country.visited) {
            // Heatmap colors: yellow -> orange -> red -> dark red based on visit count
            const visitCount = country.visit_count || 1
            if (visitCount === 1) return "#FFEB3B"
            if (visitCount === 2) return "#FFC107"
            if (visitCount === 3) return "#FF9800"
            if (visitCount === 4) return "#FF5722"
            if (visitCount === 5) return "#F44336"
            if (visitCount >= 6 && visitCount < 10) return "#E91E63"
            if (visitCount >= 10 && visitCount < 20) return "#9C27B0"
            return "#4A148C"
          }
          return "#E8E8E8"
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
          d3.select(this)
            .attr("stroke", "#333")
            .attr("stroke-width", 2)
        })
        .on("mouseout", function(event, d) {
          d3.select(this)
            .attr("stroke", "#fff")
            .attr("stroke-width", 0.5)
        })
        .on("click", (event, d) => {
          // Find matching country in database
          let country = data.find(c => c.iso_code && (c.iso_code === d.properties["ISO3166-1-Alpha-3"] || c.iso_code === d.properties["ISO3166-1-Alpha-2"]))
          if (!country) {
            country = data.find(c => c.name === d.properties.name)
          }
          
          if (country) {
            this.toggleCountry(country.id, event.currentTarget)
          }
        })
      
      // Add legend
      this.addLegend(svg, width, height)
    }).catch(error => {
      console.error("Error loading map data:", error)
    })
  }

  addLegend(svg, width, height) {
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - 150}, ${height - 200})`)
    
    const legendData = [
      { label: "Not visited", color: "#E8E8E8" },
      { label: "1 visit", color: "#FFEB3B" },
      { label: "2 visits", color: "#FFC107" },
      { label: "3 visits", color: "#FF9800" },
      { label: "4 visits", color: "#FF5722" },
      { label: "5 visits", color: "#F44336" },
      { label: "6-9 visits", color: "#E91E63" },
      { label: "10-19 visits", color: "#9C27B0" },
      { label: "20+ visits 🔥", color: "#4A148C" }
    ]
    
    legendData.forEach((item, i) => {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 20})`)
      
      legendRow.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", item.color)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
      
      legendRow.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .attr("font-size", "11px")
        .attr("fill", "#333")
        .text(item.label)
    })
  }

  toggleCountry(countryId, pathElement) {
    const checkbox = document.getElementById(`country_${countryId}`)
    const countInput = document.getElementById(`country_count_${countryId}`)
    
    if (checkbox && countInput) {
      if (!checkbox.checked) {
        checkbox.checked = true
        countInput.value = 1
        countInput.disabled = false
      } else {
        let currentCount = parseInt(countInput.value) || 1
        currentCount = currentCount + 1
        if (currentCount > 99) currentCount = 99
        countInput.value = currentCount
      }
      this.updateMapColor(pathElement, parseInt(countInput.value))
    }
  }
  
  updateMapColor(pathElement, visitCount) {
    let color = "#E8E8E8"
    
    if (visitCount === 1) color = "#FFEB3B"
    else if (visitCount === 2) color = "#FFC107"
    else if (visitCount === 3) color = "#FF9800"
    else if (visitCount === 4) color = "#FF5722"
    else if (visitCount === 5) color = "#F44336"
    else if (visitCount >= 6 && visitCount < 10) color = "#E91E63"
    else if (visitCount >= 10 && visitCount < 20) color = "#9C27B0"
    else if (visitCount >= 20) color = "#4A148C"
    
    d3.select(pathElement).attr("fill", color)
  }
}