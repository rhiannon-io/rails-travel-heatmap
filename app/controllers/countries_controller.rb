class CountriesController < ApplicationController
  before_action :authenticate_user!, except: [ :shared, :og_image ]
  before_action :set_country, only: %i[ show edit update destroy ]
  skip_before_action :verify_authenticity_token, only: [ :update_visited, :create_shared ]

  # GET /countries or /countries.json
  def index
    @countries = Country.order(:name)

    # Get user's visited countries through the join table
    user_country_map = current_user.user_countries.includes(:country).index_by(&:country_id)

    @countries_data = @countries.map do |c|
      user_country = user_country_map[c.id]
      {
        id: c.id,
        name: c.name,
        iso_code: c.iso_code,
        visited: user_country.present?,
        visit_count: user_country&.visit_count || 1,
        home_country: user_country&.home_country || false
      }
    end

    @shared_mode = false
    @shared_map = nil
  end

  # GET /shared/:token
  def shared
    @shared_map = SharedMap.find_by(token: params[:token])

    if @shared_map.nil?
      redirect_to root_path, alert: "Shared map not found"
      return
    end

    @countries = Country.order(:name)
    @shared_mode = true

    # Parse the stored data (format: {"USA":{"visits":5,"home":false}})
    shared_data = JSON.parse(@shared_map.data)

    # Map shared data to countries, preserving visit counts and home country status
    @countries_data = @countries.map do |c|
      if shared_data.key?(c.iso_code)
        country_info = shared_data[c.iso_code]
        # Handle both old format (just number) and new format (hash with visits and home)
        if country_info.is_a?(Hash)
          { id: c.id, name: c.name, iso_code: c.iso_code, visited: true, visit_count: country_info["visits"] || country_info["visit_count"] || 1, home_country: country_info["home"] || false }
        else
          { id: c.id, name: c.name, iso_code: c.iso_code, visited: true, visit_count: country_info, home_country: false }
        end
      else
        { id: c.id, name: c.name, iso_code: c.iso_code, visited: false, visit_count: 1, home_country: false }
      end
    end

    render :index
  end

  # GET /shared/:token/og_image.png
  def og_image
    @shared_map = SharedMap.find_by(token: params[:token])

    if @shared_map.nil?
      head :not_found
      return
    end

    # Check if we have a cached image
    cache_key = "og_image_#{@shared_map.token}_#{@shared_map.updated_at.to_i}"
    cached_image = Rails.cache.read(cache_key)

    if cached_image
      send_data cached_image, type: "image/png", disposition: "inline"
      return
    end

    @countries = Country.order(:name)
    shared_data = JSON.parse(@shared_map.data)

    @countries_data = @countries.map do |c|
      if shared_data.key?(c.iso_code)
        country_info = shared_data[c.iso_code]
        if country_info.is_a?(Hash)
          { id: c.id, name: c.name, iso_code: c.iso_code, visited: true, visit_count: country_info["visits"] || 1, home_country: country_info["home"] || false }
        else
          { id: c.id, name: c.name, iso_code: c.iso_code, visited: true, visit_count: country_info, home_country: false }
        end
      else
        { id: c.id, name: c.name, iso_code: c.iso_code, visited: false, visit_count: 1, home_country: false }
      end
    end

    # Generate SVG and convert to PNG using rsvg-convert
    svg_data = render_to_string(
      template: "countries/og_image_svg",
      layout: false,
      locals: { countries_data: @countries_data, shared_map: @shared_map }
    )

    require "open3"
    
    begin
      png_data, stderr, status = Open3.capture3("rsvg-convert", "-w", "1200", "-h", "630", "-f", "png", stdin_data: svg_data)

      if status.success? && png_data.present?
        Rails.cache.write(cache_key, png_data, expires_in: 1.hour)
        send_data png_data, type: "image/png", disposition: "inline"
      else
        Rails.logger.error "rsvg-convert failed: #{stderr}"
        head :internal_server_error
      end
    rescue => e
      Rails.logger.error "OG image generation error: #{e.class} - #{e.message}"
      Rails.logger.error e.backtrace.first(5).join("\n")
      head :internal_server_error
    end
  end


  # POST /countries/create_shared
  def create_shared
    # Get current user's visited countries through the join table
    user_countries = current_user.user_countries.includes(:country)

    # Build data hash with ISO codes, visit counts, and home country status
    data = {}
    user_countries.each do |uc|
      data[uc.country.iso_code] = { visits: uc.visit_count, home: uc.home_country }
    end

    # Get owner name from params
    owner_name = params[:owner_name]

    # Check if updating an existing shared map
    token = params[:token]
    if token.present?
      shared_map = current_user.shared_maps.find_by(token: token)
      if shared_map
        shared_map.update!(data: data.to_json, owner_name: owner_name)
      else
        # Token not found, create new one
        shared_map = current_user.shared_maps.create!(data: data.to_json, owner_name: owner_name)
      end
    else
      # Create new shared map
      shared_map = current_user.shared_maps.create!(data: data.to_json, owner_name: owner_name)
    end

    # Generate the full URL
    share_url = "#{request.base_url}/shared/#{shared_map.token}"

    render json: { token: shared_map.token, url: share_url }
  end

  # PATCH /update_visited_countries
  def update_visited
    countries_params = params[:countries] || {}

    # Remove all existing user_countries for this user
    current_user.user_countries.destroy_all

    # Create user_countries for visited countries with their visit counts
    countries_params.each do |country_id, country_data|
      if country_data[:visited] == "1"
        visit_count = country_data[:visit_count].to_i
        visit_count = 1 if visit_count < 1 # Ensure at least 1
        home_country = country_data[:home_country] == "1"
        current_user.user_countries.create!(
          country_id: country_id,
          visit_count: visit_count,
          home_country: home_country
        )
      end
    end

    respond_to do |format|
      format.html { redirect_to countries_path }
      format.json { render json: { success: true }, status: :ok }
    end
  end

  # GET /countries/new
  def new
    @country = Country.new
  end

  # GET /countries/1/edit
  def edit
  end

  # POST /countries or /countries.json
  def create
    @country = Country.new(country_params)

    respond_to do |format|
      if @country.save
        format.html { redirect_to @country, notice: "Country was successfully created." }
        format.json { render :show, status: :created, location: @country }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @country.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /countries/1 or /countries/1.json
  def update
    respond_to do |format|
      if @country.update(country_params)
        format.html { redirect_to @country, notice: "Country was successfully updated.", status: :see_other }
        format.json { render :show, status: :ok, location: @country }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @country.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /countries/1 or /countries/1.json
  def destroy
    @country.destroy!

    respond_to do |format|
      format.html { redirect_to countries_path, notice: "Country was successfully destroyed.", status: :see_other }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_country
      @country = Country.find(params.expect(:id))
    end

    # Only allow a list of trusted parameters through.
    def country_params
      params.expect(country: [ :name, :iso_code, :visit_count ])
    end
end
