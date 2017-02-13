require 'data_analysis'

class PagesController < ApplicationController
  include Services::DataAnalysis

  def home
    @no_header = true
  end

  def wakefield
    typeform_id = 'HHlHgX'
    @dev_site = DevSite.find_by(devID: 'wakefield-1')
    @survey_sentiment = generate_survey_sentiment(typeform_id).to_json
    @no_header = true
  end

  def contact_milieu
    message = contact_milieu_params
    ContactMailer.contact_milieu(message).deliver_now
    render nothing: true
  end

  def contact_file_lead
    message = contact_planner_params
    ContactMailer.contact_file_lead(message).deliver_now
    render json: {}
  end

  def contact_councillor
    message = contact_planner_params
    ContactMailer.contact_councillor(message).deliver_now
    render json: {}
  end

  def about; end

  private

  def contact_milieu_params
    params.required(:contact_milieu).permit(:name, :email, :message)
  end

  def contact_planner_params
    params.permit(:name, :email, :message, :dev_site_id)
  end

  def generate_survey_sentiment(typeform_id)
    survey = CustomSurvey.find_by(typeform_id: typeform_id)
    comments = survey.survey_responses.map(&:comments).flatten

    return unless comments.present? && comments.count > 5

    results = overall_sentiments(comments)
    Sentiment.create(results[:averages])
  end
end
