import { Controller } from "@hotwired/stimulus"
import * as d3 from "d3"
import * as topojson from "topojson-client"

// Helper function for visit count colors
function getVisitColor(visitCount, homeCountry) {
  if (homeCountry) return "#1565C0" // Blue for home country
  if (visitCount === 1) return "#FFEB3B"
  if (visitCount === 2) return "#FFC107"
  if (visitCount === 3) return "#FF9800"
  if (visitCount === 4) return "#FF5722"
  if (visitCount === 5) return "#F44336"
  if (visitCount >= 6 && visitCount < 10) return "#E91E63"
  if (visitCount >= 10 && visitCount < 20) return "#9C27B0"
  if (visitCount >= 20) return "#4A148C"
  return "#E8E8E8"
}

// Helper function for rating colors (red → yellow → green scale)
function getRatingColor(rating, homeCountry) {
  if (homeCountry) return "#1565C0" // Blue for home country
  if (!rating) return "#757575" // Visited but no rating - dark gray
  // Red (bad) → Yellow (neutral) → Green (great)
  const ratingColors = [
    "#E53935", // 1 - Red
    "#FF9800", // 2 - Orange
    "#FDD835", // 3 - Yellow
    "#7CB342", // 4 - Light green
    "#2E7D32"  // 5 - Dark green
  ]
  return ratingColors[Math.min(rating, 5) - 1]
}

// Helper function for top countries colors (red → green scale, same as ratings)
function getTopCountryColor(superScore, homeCountry) {
  if (homeCountry) return "#1565C0" // Blue for home country
  if (!superScore) return "#757575" // Visited but no score - dark gray
  // Red (low) → Yellow (mid) → Green (high)
  if (superScore >= 4.5) return "#2E7D32" // Dark green
  if (superScore >= 3.5) return "#7CB342" // Light green
  if (superScore >= 2.5) return "#FDD835" // Yellow
  if (superScore >= 1.5) return "#FF9800" // Orange
  return "#E53935" // Red
}

export default class extends Controller {
  static values = { data: Array }

  connect() {
    console.log("Map connected", this.dataValue, typeof this.dataValue)
    this.viewMode = 'top' // 'top', 'visits', or 'rating'
    this.renderMap()
    
    // Listen for country changes from checkboxes
    document.addEventListener('country-changed', this.handleCountryChange.bind(this))
    // Listen for view mode toggle
    document.addEventListener('map-view-changed', this.handleViewModeChange.bind(this))
    // Listen for rating changes
    document.addEventListener('rating-changed', this.handleRatingChange.bind(this))
  }
  
  disconnect() {
    document.removeEventListener('country-changed', this.handleCountryChange.bind(this))
    document.removeEventListener('map-view-changed', this.handleViewModeChange.bind(this))
    document.removeEventListener('rating-changed', this.handleRatingChange.bind(this))
  }
  
  handleRatingChange(event) {
    const { countryId, rating } = event.detail
    const countryData = this.dataValue.find(c => c.id === parseInt(countryId))
    if (!countryData) return
    
    // Update the rating in data
    countryData.rating = rating
    
    // Recalculate super_score client-side when rating changes
    if (countryData.visited) {
      const allVisited = this.dataValue.filter(c => c.visited)
      const maxVisits = Math.max(...allVisited.map(c => c.visit_count), 2)
      const normalizedFrequency = Math.min(5, Math.max(1, (Math.log(countryData.visit_count) / Math.log(maxVisits) * 4) + 1))
      
      if (rating) {
        countryData.super_score = parseFloat(((0.70 * rating) + (0.30 * normalizedFrequency)).toFixed(2))
      } else {
        countryData.super_score = parseFloat((normalizedFrequency * 0.5).toFixed(2))
      }
    }
    
    // Update map immediately if we're in rating or top view mode
    if (this.viewMode === 'rating' || this.viewMode === 'top') {
      this.updateCountryOnMap(countryData)
    }
  }
  
  handleViewModeChange(event) {
    this.viewMode = event.detail.mode
    this.refreshAllCountryColors()
    this.updateLegend()
  }
  
  refreshAllCountryColors() {
    const svg = d3.select(this.element).select('svg')
    const data = this.dataValue
    const viewMode = this.viewMode
    
    svg.selectAll('path').each(function(d) {
      if (!d || !d.properties) return
      
      let country = data.find(c => c.iso_code && (c.iso_code === d.properties["ISO3166-1-Alpha-3"] || c.iso_code === d.properties["ISO3166-1-Alpha-2"]))
      if (!country) {
        country = data.find(c => c.name === d.properties.name)
      }
      
      let color = "#E8E8E8" // Not visited
      
      if (country && country.visited) {
        if (viewMode === 'rating') {
          color = getRatingColor(country.rating, country.home_country)
        } else if (viewMode === 'top') {
          color = getTopCountryColor(country.super_score, country.home_country)
        } else {
          color = getVisitColor(country.visit_count, country.home_country)
        }
      }
      
      d3.select(this).attr("fill", color)
    })
  }
  
  handleCountryChange(event) {
    const { countryId, visitCount, homeCountry } = event.detail
    const countryData = this.dataValue.find(c => c.id === parseInt(countryId))
    if (!countryData) return
    
    // Update all the data properties
    countryData.visited = visitCount > 0
    countryData.visit_count = visitCount > 0 ? visitCount : 1
    countryData.home_country = homeCountry || false
    
    // Clear rating and super_score if country is being unchecked
    if (visitCount === 0) {
      countryData.rating = null
      countryData.super_score = null
    } else {
      // Recalculate super_score client-side when visits change
      const allVisited = this.dataValue.filter(c => c.visited)
      const maxVisits = Math.max(...allVisited.map(c => c.visit_count), 2)
      const normalizedFrequency = Math.min(5, Math.max(1, (Math.log(countryData.visit_count) / Math.log(maxVisits) * 4) + 1))
      
      if (countryData.rating) {
        countryData.super_score = parseFloat(((0.70 * countryData.rating) + (0.30 * normalizedFrequency)).toFixed(2))
      } else {
        countryData.super_score = parseFloat((normalizedFrequency * 0.5).toFixed(2))
      }
    }
    
    // Find and update the corresponding path element
    this.updateCountryOnMap(countryData)
  }
  
  updateCountryOnMap(countryData) {
    const svg = d3.select(this.element).select('svg')
    const viewMode = this.viewMode
    
    svg.selectAll('path').each(function(d) {
      if (!d) return
      const isoMatch = countryData.iso_code && 
                      (countryData.iso_code === d.properties["ISO3166-1-Alpha-3"] || 
                       countryData.iso_code === d.properties["ISO3166-1-Alpha-2"])
      const nameMatch = countryData.name === d.properties.name
      
      if (isoMatch || nameMatch) {
        let color = "#E8E8E8" // Not visited
        
        if (countryData.visited) {
          if (viewMode === 'rating') {
            color = getRatingColor(countryData.rating, countryData.home_country)
          } else if (viewMode === 'top') {
            color = getTopCountryColor(countryData.super_score, countryData.home_country)
          } else {
            color = getVisitColor(countryData.visit_count, countryData.home_country)
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
            // Use view mode to determine color
            if (this.viewMode === 'rating') {
              return getRatingColor(country.rating, country.home_country)
            } else if (this.viewMode === 'top') {
              return getTopCountryColor(country.super_score, country.home_country)
            } else {
              return getVisitColor(country.visit_count || 1, country.home_country)
            }
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
      .attr("transform", `translate(${width - 150}, ${height - 340})`)
    
    this.drawLegendContent(legend)
  }
  
  updateLegend() {
    const svg = d3.select(this.element).select('svg')
    const legend = svg.select('.legend')
    
    // Clear existing legend content
    legend.selectAll('*').remove()
    
    this.drawLegendContent(legend)
  }
  
  drawLegendContent(legend) {
    const viewMode = this.viewMode
    
    // Add title with instructions
    legend.append("text")
      .attr("class", "legend-title")
      .attr("x", 0)
      .attr("y", -10)
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "#333")
      .text(viewMode === 'rating' ? "Country Rating" : viewMode === 'top' ? "Top Countries" : "Visit Count")
    
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
    
    let legendData
    if (viewMode === 'rating') {
      legendData = [
        { label: "Not visited", color: "#E8E8E8" },
        { label: "🏠 Home country", color: "#1565C0" },
        { label: "Visited, no rating", color: "#757575" },
        { label: "1 😞", color: "#E53935" },
        { label: "2", color: "#FF9800" },
        { label: "3 😐", color: "#FDD835" },
        { label: "4", color: "#7CB342" },
        { label: "5 🤩", color: "#2E7D32" }
      ]
    } else if (viewMode === 'top') {
      legendData = [
        { label: "Not visited", color: "#E8E8E8" },
        { label: "🏠 Home country", color: "#1565C0" },
        { label: "Visited, unrated", color: "#757575" },
        { label: "Lower", color: "#E53935" },
        { label: "↓", color: "#FF9800" },
        { label: "Medium", color: "#FDD835" },
        { label: "↑", color: "#7CB342" },
        { label: "Top 🏆", color: "#2E7D32" }
      ]
    } else {
      legendData = [
        { label: "Not visited", color: "#E8E8E8" },
        { label: "🏠 Home country", color: "#1565C0" },
        { label: "1 visit", color: "#FFEB3B" },
        { label: "2 visits", color: "#FFC107" },
        { label: "3 visits", color: "#FF9800" },
        { label: "4 visits", color: "#FF5722" },
        { label: "5 visits", color: "#F44336" },
        { label: "6-9 visits", color: "#E91E63" },
        { label: "10-19 visits", color: "#9C27B0" },
        { label: "20+ visits 🔥", color: "#4A148C" }
      ]
    }
    
    legendData.forEach((item, i) => {
      const legendRow = legend.append("g")
        .attr("class", "legend-item")
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
    const ratingInput = document.getElementById(`country_rating_${countryId}`)
    
    if (checkbox && countInput) {
      let newCount
      if (!checkbox.checked) {
        checkbox.checked = true
        countInput.value = 1
        countInput.disabled = false
        if (homeCheckbox) homeCheckbox.disabled = false
        if (ratingInput) ratingInput.disabled = false
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
      
      this.updateMapColor(pathElement, countryData)
    }
  }
  
  uncheckCountry(countryId, pathElement) {
    const checkbox = document.getElementById(`country_${countryId}`)
    const countInput = document.getElementById(`country_count_${countryId}`)
    const homeCheckbox = document.getElementById(`country_home_${countryId}`)
    const ratingInput = document.getElementById(`country_rating_${countryId}`)
    
    if (checkbox && countInput) {
      checkbox.checked = false
      countInput.value = 1
      countInput.disabled = true
      if (homeCheckbox) {
        homeCheckbox.checked = false
        homeCheckbox.disabled = true
      }
      if (ratingInput) {
        ratingInput.value = ''
        ratingInput.disabled = true
      }
      
      // Update the internal data array for tooltip
      const countryData = this.dataValue.find(c => c.id === parseInt(countryId))
      if (countryData) {
        countryData.visited = false
        countryData.visit_count = 1
        countryData.home_country = false
        countryData.rating = null
      }
      
      // Dispatch event to sync
      const event = new CustomEvent('country-changed', {
        detail: { countryId: countryId, visitCount: 0, homeCountry: false }
      })
      document.dispatchEvent(event)
      
      // Trigger change event on checkbox to trigger auto-save
      checkbox.dispatchEvent(new Event('change', { bubbles: true }))
      
      this.updateMapColor(pathElement, countryData)
    }
  }
  
  updateMapColor(pathElement, countryData) {
    let color = "#E8E8E8"
    
    if (countryData && countryData.visited) {
      if (this.viewMode === 'rating') {
        color = getRatingColor(countryData.rating, countryData.home_country)
      } else {
        color = getVisitColor(countryData.visit_count || 1, countryData.home_country)
      }
    }
    
    d3.select(pathElement).attr("fill", color)
  }
}