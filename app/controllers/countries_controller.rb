class CountriesController < ApplicationController
  before_action :authenticate_user!, except: [ :shared ]
  before_action :set_country, only: %i[ show edit update destroy ]
  skip_before_action :verify_authenticity_token, only: [ :update_visited, :create_shared ]

  # GET /countries or /countries.json
  def index
    @countries = Country.order(:name)

    # Get user's visited countries through the join table
    user_country_map = current_user.user_countries.includes(:country).index_by(&:country_id)

    # Calculate max visits for log-scale normalization
    max_visits = user_country_map.values.map(&:visit_count).max || 1
    max_visits = [max_visits, 2].max # Ensure at least 2 to avoid log(1) = 0 issues

    @countries_data = @countries.map do |c|
      user_country = user_country_map[c.id]
      visit_count = user_country&.visit_count || 1
      rating = user_country&.rating
      visited = user_country.present?

      # Calculate normalized frequency (1-5 scale) using log scale
      normalized_frequency = if visited && max_visits > 1
        (Math.log(visit_count) / Math.log(max_visits) * 4) + 1 # Maps to 1-5
      else
        1
      end
      normalized_frequency = [[normalized_frequency, 5].min, 1].max # Clamp to 1-5

      # Calculate super score
      super_score = if visited
        if rating
          (0.70 * rating) + (0.30 * normalized_frequency)
        else
          normalized_frequency * 0.5
        end
      else
        nil
      end

      {
        id: c.id,
        name: c.name,
        iso_code: c.iso_code,
        visited: visited,
        visit_count: visit_count,
        home_country: user_country&.home_country || false,
        rating: rating,
        notes: user_country&.notes,
        super_score: super_score&.round(2)
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

    # Calculate max visits for log-scale normalization
    max_visits = shared_data.values.map { |v| v.is_a?(Hash) ? (v["visits"] || v["visit_count"] || 1) : v }.max || 1
    max_visits = [max_visits, 2].max

    # Map shared data to countries, preserving visit counts and home country status
    @countries_data = @countries.map do |c|
      if shared_data.key?(c.iso_code)
        country_info = shared_data[c.iso_code]
        # Handle both old format (just number) and new format (hash with visits and home)
        if country_info.is_a?(Hash)
          visit_count = country_info["visits"] || country_info["visit_count"] || 1
          rating = country_info["rating"]
          
          # Calculate normalized frequency
          normalized_frequency = (Math.log(visit_count) / Math.log(max_visits) * 4) + 1
          normalized_frequency = [[normalized_frequency, 5].min, 1].max
          
          # Calculate super score
          super_score = if rating
            (0.70 * rating) + (0.30 * normalized_frequency)
          else
            normalized_frequency * 0.5
          end
          
          { id: c.id, name: c.name, iso_code: c.iso_code, visited: true, visit_count: visit_count, home_country: country_info["home"] || false, rating: rating, notes: country_info["notes"], super_score: super_score.round(2) }
        else
          normalized_frequency = (Math.log(country_info) / Math.log(max_visits) * 4) + 1
          normalized_frequency = [[normalized_frequency, 5].min, 1].max
          { id: c.id, name: c.name, iso_code: c.iso_code, visited: true, visit_count: country_info, home_country: false, rating: nil, notes: nil, super_score: (normalized_frequency * 0.5).round(2) }
        end
      else
        { id: c.id, name: c.name, iso_code: c.iso_code, visited: false, visit_count: 1, home_country: false, rating: nil, notes: nil, super_score: nil }
      end
    end

    render :index
  end

  # POST /countries/create_shared
  def create_shared
    # Get current user's visited countries through the join table
    user_countries = current_user.user_countries.includes(:country)

    # Build data hash with ISO codes, visit counts, home country status, rating, and notes
    data = {}
    user_countries.each do |uc|
      data[uc.country.iso_code] = { visits: uc.visit_count, home: uc.home_country, rating: uc.rating, notes: uc.notes }
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

    # Create user_countries for visited countries with their visit counts and ratings
    countries_params.each do |country_id, country_data|
      if country_data[:visited] == "1"
        visit_count = country_data[:visit_count].to_i
        visit_count = 1 if visit_count < 1 # Ensure at least 1
        home_country = country_data[:home_country] == "1"
        rating = country_data[:rating].present? ? country_data[:rating].to_i : nil
        rating = nil if rating && (rating < 1 || rating > 5) # Ensure rating is 1-5 or nil
        notes = country_data[:notes].present? ? country_data[:notes].to_s.strip[0, 1000] : nil # Limit to 1000 chars
        current_user.user_countries.create!(
          country_id: country_id,
          visit_count: visit_count,
          home_country: home_country,
          rating: rating,
          notes: notes
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
