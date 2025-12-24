class CountriesController < ApplicationController
  before_action :set_country, only: %i[ show edit update destroy ]
  skip_before_action :verify_authenticity_token, only: :update_visited

  # GET /countries or /countries.json
  def index
    @countries = Country.order(:name)
    @countries_data = @countries.map { |c| { id: c.id, name: c.name, iso_code: c.iso_code, visited: c.visited, visit_count: c.visit_count } }
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
