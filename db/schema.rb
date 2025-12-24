# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2025_12_24_023340) do
  create_table "countries", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "iso_code"
    t.string "name"
    t.datetime "updated_at", null: false
    t.integer "visit_count", default: 1, null: false
    t.boolean "visited"
  end

  create_table "shareable_maps", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "data"
    t.string "token"
    t.datetime "updated_at", null: false
    t.integer "user_id"
    t.index ["token"], name: "index_shareable_maps_on_token", unique: true
  end

  create_table "shared_maps", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "data", null: false
    t.string "token", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id"
    t.index ["token"], name: "index_shared_maps_on_token", unique: true
    t.index ["user_id"], name: "index_shared_maps_on_user_id"
  end

  create_table "user_countries", force: :cascade do |t|
    t.integer "country_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.integer "visit_count", default: 1, null: false
    t.index ["country_id"], name: "index_user_countries_on_country_id"
    t.index ["user_id", "country_id"], name: "index_user_countries_on_user_id_and_country_id", unique: true
    t.index ["user_id"], name: "index_user_countries_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "shared_maps", "users"
  add_foreign_key "user_countries", "countries"
  add_foreign_key "user_countries", "users"
end
