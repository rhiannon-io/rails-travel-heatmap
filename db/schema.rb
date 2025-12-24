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

ActiveRecord::Schema[8.1].define(version: 2025_12_24_021053) do
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
    t.index ["token"], name: "index_shared_maps_on_token", unique: true
  end
end
