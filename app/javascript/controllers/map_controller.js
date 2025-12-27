import { Controller } from "@hotwired/stimulus"
import * as d3 from "d3"
import * as topojson from "topojson-client"

export default class extends Controller {
  static values = { data: Array }

  connect() {
    console.log("Map connected", this.dataValue, typeof this.dataValue)
    this.renderMap()
    
    // Listen for country changes from checkboxes
    document.addEventListener('country-changed', this.handleCountryChange.bind(this))
  }
  
  disconnect() {
    document.removeEventListener('country-changed', this.handleCountryChange.bind(this))
  }
  
  handleCountryChange(event) {
    const { countryId, visitCount, homeCountry } = event.detail
    const countryData = this.dataValue.find(c => c.id === parseInt(countryId))
    if (!countryData) return
    
    // Update the data
    countryData.home_country = homeCountry || false
    
    // Find and update the corresponding path element
    this.updateCountryOnMap(countryData, visitCount)
  }
  
  updateCountryOnMap(countryData, visitCount) {
    const svg = d3.select(this.element).select('svg')
    svg.selectAll('path').each(function(d) {
      if (!d) return
      const isoMatch = countryData.iso_code && 
                      (countryData.iso_code === d.properties["ISO3166-1-Alpha-3"] || 
                       countryData.iso_code === d.properties["ISO3166-1-Alpha-2"])
      const nameMatch = countryData.name === d.properties.name
      
      if (isoMatch || nameMatch) {
        let color = "#E8E8E8" // Not visited
        
        if (visitCount > 0) {
          // Home country gets a distinct green color
          if (countryData.home_country) {
            color = "#4caf50"
          } else {
            // Regular visit colors
            if (visitCount === 1) color = "#FFEB3B"
            else if (visitCount === 2) color = "#FFC107"
            else if (visitCount === 3) color = "#FF9800"
            else if (visitCount === 4) color = "#FF5722"
            else if (visitCount === 5) color = "#F44336"
            else if (visitCount >= 6 && visitCount < 10) color = "#E91E63"
            else if (visitCount >= 10 && visitCount < 20) color = "#9C27B0"
            else if (visitCount >= 20) color = "#4A148C"
          }
        }
        
        d3.select(this).attr("fill", color)
      }
    })
  }

  renderMap() {
    console.log("Rendering map")
    const data = this.dataValue
    console.log("Data:", data)
    const width = 960
    const height = 650

    const svg = d3.select(this.element)
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("width", "100%")
      .style("height", "100%")

    // Create tooltip
    const tooltip = d3.select(this.element)
      .append("div")
      .attr("class", "map-tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "rgba(0, 0, 0, 0.85)")
      .style("color", "white")
      .style("padding", "8px 12px")
      .style("border-radius", "4px")
      .style("font-size", "14px")
      .style("font-weight", "500")
      .style("pointer-events", "none")
      .style("z-index", "1000")
      .style("box-shadow", "0 2px 4px rgba(0,0,0,0.2)")

    const projection = d3.geoNaturalEarth1()
      .scale(width / 1.65 / Math.PI)
      .translate([width / 2, height / 2])

    const path = d3.geoPath().projection(projection)

    d3.json("/ne_countries_admin_0.geojson").then(geojson => {
      const mapGroup = svg.append("g")
      
      // Add zoom behavior after mapGroup is created
      const zoom = d3.zoom()
        .scaleExtent([1, 8])  // Min zoom 1x, max zoom 8x
        .on('zoom', (event) => {
          mapGroup.attr('transform', event.transform)
        })

      svg.call(zoom)

      // Add zoom control buttons
      this.addZoomControls(svg, zoom, width, height)
      
      mapGroup.selectAll("path")
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
            // Home country gets a distinct green color
            if (country.home_country) {
              return "#4caf50"
            }
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
        .on("mouseover", (event, d) => {
          d3.select(event.currentTarget)
            .attr("stroke", "#333")
            .attr("stroke-width", 2)
          
          // Show tooltip with country name only
          const countryName = d.properties.name || d.properties.NAME || "Unknown"
          
          tooltip
            .style("visibility", "visible")
            .text(countryName)
        })
        .on("mousemove", function(event) {
          tooltip
            .style("top", (event.pageY - 10) + "px")
            .style("left", (event.pageX + 10) + "px")
        })
        .on("mouseout", function(event, d) {
          d3.select(this)
            .attr("stroke", "#fff")
            .attr("stroke-width", 0.5)
          
          tooltip.style("visibility", "hidden")
        })
        .on("click", (event, d) => {
          // Find matching country in database
          let country = data.find(c => c.iso_code && (c.iso_code === d.properties["ISO3166-1-Alpha-3"] || c.iso_code === d.properties["ISO3166-1-Alpha-2"]))
          if (!country) {
            country = data.find(c => c.name === d.properties.name)
          }
          
          if (country) {
            // Check if Shift key is pressed for unchecking
            if (event.shiftKey) {
              this.uncheckCountry(country.id, event.currentTarget)
            } else {
              this.toggleCountry(country.id, event.currentTarget)
            }
          }
        })
      
      // Add legend (keep it fixed, not zoomed)
      this.addLegend(svg, width, height)
      
      // Add zoom instructions
      this.addZoomInstructions(svg, width)
    }).catch(error => {
      console.error("Error loading map data:", error)
    })
  }

  addZoomInstructions(svg, width) {
    const instructions = svg.append("g")
      .attr("class", "zoom-instructions")
      .attr("transform", `translate(10, 10)`)
    
    instructions.append("rect")
      .attr("width", 200)
      .attr("height", 60)
      .attr("fill", "rgba(255, 255, 255, 0.9)")
      .attr("stroke", "#ccc")
      .attr("stroke-width", 1)
      .attr("rx", 4)
    
    instructions.append("text")
      .attr("x", 10)
      .attr("y", 20)
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "#333")
      .text("🔍 Map Controls")
    
    instructions.append("text")
      .attr("x", 10)
      .attr("y", 38)
      .attr("font-size", "11px")
      .attr("fill", "#666")
      .text("Scroll: Zoom in/out")
    
    instructions.append("text")
      .attr("x", 10)
      .attr("y", 52)
      .attr("font-size", "11px")
      .attr("fill", "#666")
      .text("Drag: Pan around")
  }

  addZoomControls(svg, zoom, width, height) {
    const controls = svg.append("g")
      .attr("class", "zoom-controls")
      .attr("transform", `translate(${width - 50}, 10)`)
    
    // Zoom in button
    const zoomInBtn = controls.append("g")
      .attr("cursor", "pointer")
      .on("click", () => {
        svg.transition().duration(300).call(zoom.scaleBy, 1.3)
      })
    
    zoomInBtn.append("rect")
      .attr("width", 40)
      .attr("height", 40)
      .attr("fill", "white")
      .attr("stroke", "#666")
      .attr("stroke-width", 1)
      .attr("rx", 4)
    
    zoomInBtn.append("text")
      .attr("x", 20)
      .attr("y", 27)
      .attr("text-anchor", "middle")
      .attr("font-size", "24px")
      .attr("font-weight", "bold")
      .attr("fill", "#333")
      .text("+")
    
    // Zoom out button
    const zoomOutBtn = controls.append("g")
      .attr("cursor", "pointer")
      .attr("transform", "translate(0, 45)")
      .on("click", () => {
        svg.transition().duration(300).call(zoom.scaleBy, 0.7)
      })
    
    zoomOutBtn.append("rect")
      .attr("width", 40)
      .attr("height", 40)
      .attr("fill", "white")
      .attr("stroke", "#666")
      .attr("stroke-width", 1)
      .attr("rx", 4)
    
    zoomOutBtn.append("text")
      .attr("x", 20)
      .attr("y", 27)
      .attr("text-anchor", "middle")
      .attr("font-size", "24px")
      .attr("font-weight", "bold")
      .attr("fill", "#333")
      .text("−")
    
    // Reset button
    const resetBtn = controls.append("g")
      .attr("cursor", "pointer")
      .attr("transform", "translate(0, 90)")
      .on("click", () => {
        svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity)
      })
    
    resetBtn.append("rect")
      .attr("width", 40)
      .attr("height", 40)
      .attr("fill", "white")
      .attr("stroke", "#666")
      .attr("stroke-width", 1)
      .attr("rx", 4)
    
    resetBtn.append("text")
      .attr("x", 20)
      .attr("y", 27)
      .attr("text-anchor", "middle")
      .attr("font-size", "18px")
      .attr("fill", "#333")
      .text("⟲")
  }

  addLegend(svg, width, height) {
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - 150}, ${height - 270})`)
    
    // Add title with instructions
    legend.append("text")
      .attr("x", 0)
      .attr("y", -10)
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "#333")
      .text("Visit Count")
    
    legend.append("text")
      .attr("x", 0)
      .attr("y", 5)
      .attr("font-size", "9px")
      .attr("fill", "#666")
      .text("Click: Add/Increment")
    
    legend.append("text")
      .attr("x", 0)
      .attr("y", 15)
      .attr("font-size", "9px")
      .attr("fill", "#666")
      .text("Shift+Click: Remove")
    
    const legendData = [
      { label: "Not visited", color: "#E8E8E8" },
      { label: "🏠 Home country", color: "#4caf50" },
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
        .attr("transform", `translate(0, ${i * 20 + 30})`)
      
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
    const homeCheckbox = document.getElementById(`country_home_${countryId}`)
    
    if (checkbox && countInput) {
      let newCount
      if (!checkbox.checked) {
        checkbox.checked = true
        countInput.value = 1
        countInput.disabled = false
        if (homeCheckbox) homeCheckbox.disabled = false
        newCount = 1
      } else {
        let currentCount = parseInt(countInput.value) || 1
        currentCount = currentCount + 1
        if (currentCount > 99) currentCount = 99
        countInput.value = currentCount
        newCount = currentCount
      }
      
      // Update the internal data array for tooltip
      const countryData = this.dataValue.find(c => c.id === parseInt(countryId))
      if (countryData) {
        countryData.visited = true
        countryData.visit_count = newCount
      }
      
      // Dispatch event to sync
      const event = new CustomEvent('country-changed', {
        detail: { countryId: countryId, visitCount: newCount, homeCountry: homeCheckbox ? homeCheckbox.checked : false }
      })
      document.dispatchEvent(event)
      
      // Trigger change event on input to trigger auto-save
      countInput.dispatchEvent(new Event('change', { bubbles: true }))
      
      this.updateMapColor(pathElement, newCount, homeCheckbox ? homeCheckbox.checked : false)
    }
  }
  
  uncheckCountry(countryId, pathElement) {
    const checkbox = document.getElementById(`country_${countryId}`)
    const countInput = document.getElementById(`country_count_${countryId}`)
    const homeCheckbox = document.getElementById(`country_home_${countryId}`)
    
    if (checkbox && countInput) {
      checkbox.checked = false
      countInput.value = 1
      countInput.disabled = true
      if (homeCheckbox) {
        homeCheckbox.checked = false
        homeCheckbox.disabled = true
      }
      
      // Update the internal data array for tooltip
      const countryData = this.dataValue.find(c => c.id === parseInt(countryId))
      if (countryData) {
        countryData.visited = false
        countryData.visit_count = 1
        countryData.home_country = false
      }
      
      // Dispatch event to sync
      const event = new CustomEvent('country-changed', {
        detail: { countryId: countryId, visitCount: 0, homeCountry: false }
      })
      document.dispatchEvent(event)
      
      // Trigger change event on checkbox to trigger auto-save
      checkbox.dispatchEvent(new Event('change', { bubbles: true }))
      
      this.updateMapColor(pathElement, 0, false)
    }
  }
  
  updateMapColor(pathElement, visitCount, homeCountry = false) {
    let color = "#E8E8E8"
    
    if (homeCountry) {
      color = "#4caf50"
    } else if (visitCount === 1) color = "#FFEB3B"
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