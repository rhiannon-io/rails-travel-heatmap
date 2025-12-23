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

    d3.json("/countries-110m.json").then(world => {
      svg.append("g")
        .selectAll("path")
        .data(topojson.feature(world, world.objects.countries).features)
        .enter().append("path")
        .attr("d", path)
        .attr("fill", d => {
          const country = data.find(c => c.name === d.properties.name)

          return country && country.visited ? "steelblue" : "#ccc"
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
    }).catch(error => {
      console.error("Error loading map data:", error)
    })
  }
}