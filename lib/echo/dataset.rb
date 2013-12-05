module Echo
  class Dataset
    attr_accessor :id, :dataset_id, :summary, :updated, :short_name, :version_id, :data_center
    attr_accessor :archive_center, :processing_level_id, :time_start, :time_end, :links, :boxes, :points, :dif_ids
    attr_accessor :online_access_flag, :browse_flag, :geometry
    attr_accessor :description, :processing_center, :orderable, :visible, :temporal
    attr_accessor :contacts, :science_keywords, :online_access_urls, :online_resources
    attr_accessor :associated_difs, :spatial, :browse_images
  end
end
