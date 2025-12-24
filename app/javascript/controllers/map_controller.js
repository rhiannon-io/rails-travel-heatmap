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

    const color = d3.scaleOrdinal(d3.schemeCategory10)

    d3.json("/ne_countries_admin_0.geojson").then(geojson => {
      const countries = svg.append("g")
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
          return country && country.visited ? "steelblue" : "#ccc"
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .style("cursor", "pointer")
        .on("click", (event, d) => {
          // Find matching country in database
          let country = data.find(c => c.iso_code && (c.iso_code === d.properties["ISO3166-1-Alpha-3"] || c.iso_code === d.properties["ISO3166-1-Alpha-2"]))
          if (!country) {
            country = data.find(c => c.name === d.properties.name)
          }
          
          if (country) {
            // Toggle the visited status
            this.toggleCountry(country.id, event.currentTarget)
          }
        })
    }).catch(error => {
      console.error("Error loading map data:", error)
    })
  }

  toggleCountry(countryId, pathElement) {
    // Toggle the checkbox
    const checkbox = document.getElementById(`country_${countryId}`)
    if (checkbox) {
      checkbox.checked = !checkbox.checked
    }
    
    // Toggle the map color
    const currentColor = d3.select(pathElement).attr("fill")
    const newColor = currentColor === "steelblue" ? "#ccc" : "steelblue"
    d3.select(pathElement).attr("fill", newColor)
  }
}