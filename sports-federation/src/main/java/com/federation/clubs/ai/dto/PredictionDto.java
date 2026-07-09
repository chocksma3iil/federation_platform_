package com.federation.clubs.ai.dto;

import lombok.*;
import java.util.List;

@Getter @Setter @Builder
public class PredictionDto {
    private int forecast;
    private String confidence;   // HIGH | MEDIUM | LOW
    private String trend;        // GROWING | STABLE | DECLINING
    private int forecastRangeLow;
    private int forecastRangeHigh;
    private List<Integer> historicalEstimates; // [3y,2y,1y ago]
    private List<String> riskFactors;
    private List<String> recommendations;
    private String summary;
}