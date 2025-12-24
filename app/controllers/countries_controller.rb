class CountriesController < ApplicationController
  before_action :set_country, only: %i[ show edit update destroy ]
  skip_before_action :verify_authenticity_token, only: [:update_visited, :create_shared]

  # GET /countries or /countries.json
  def index
    @countries = Country.order(:name)
    @countries_data = @countries.map { |c| { id: c.id, name: c.name, iso_code: c.iso_code, visited: c.visited, visit_count: c.visit_count } }
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
    
    # Parse the stored data (format: {"USA":5,"GBR":3})
    shared_data = JSON.parse(@shared_map.data)
    
    # Map shared data to countries, preserving visit counts
    @countries_data = @countries.map do |c|
      if shared_data.key?(c.iso_code)
        { id: c.id, name: c.name, iso_code: c.iso_code, visited: true, visit_count: shared_data[c.iso_code] }
      else
        { id: c.id, name: c.name, iso_code: c.iso_code, visited: false, visit_count: 1 }
      end
    end
    
    render :index
  end
  
  # POST /countries/create_shared
  def create_shared
    # Get current user's visited countries
    visited_countries = Country.where(visited: true)
    
    # Build data hash with ISO codes and visit counts
    data = {}
    visited_countries.each do |country|
      data[country.iso_code] = country.visit_count
    end
    
    # Check if updating an existing shared map
    token = params[:token]
    if token.present?
      shared_map = SharedMap.find_by(token: token)
      if shared_map
        shared_map.update!(data: data.to_json)
      else
        # Token not found, create new one
        shared_map = SharedMap.create!(data: data.to_json)
      end
    else
      # Create new shared map
      shared_map = SharedMap.create!(data: data.to_json)
    end
    
    # Generate the full URL
    share_url = "#{request.base_url}/shared/#{shared_map.token}"
    
    render json: { token: shared_map.token, url: share_url }
  end

  # PATCH /update_visited_countries
  def update_visited
    countries_params = params[:countries] || {}
    
    # Reset all countries to not visited
    Country.update_all(visited: false, visit_count: 1)
    
    # Update visited countries with their visit counts
    countries_params.each do |country_id, country_data|
      if country_data[:visited] == "1"
        visit_count = country_data[:visit_count].to_i
        visit_count = 1 if visit_count < 1 # Ensure at least 1
        Country.where(id: country_id).update_all(visited: true, visit_count: visit_count)
      end
    end
    
    flash[:notice] = "Updated visited countries"
    redirect_to countries_path
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
