package com.federation.results.mapper;

import com.federation.results.dto.ResultRequest;
import com.federation.results.dto.ResultResponse;
import com.federation.results.entity.Result;
import org.mapstruct.*;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ResultMapper {

    @Mapping(target = "competitionId",   source = "competition.id")
    @Mapping(target = "competitionName", source = "competition.name")
    @Mapping(target = "eventId",         source = "event.id")
    @Mapping(target = "eventName",       source = "event.name")
    @Mapping(target = "discipline",      source = "event.discipline")
    @Mapping(target = "athleteId",       source = "athlete.id")
    @Mapping(target = "athleteUserId",   expression = "java(r.getAthlete().getUser() != null ? r.getAthlete().getUser().getId() : null)")
    @Mapping(target = "athleteName",     expression = "java(r.getAthlete().getFullName())")
    @Mapping(target = "licenseNumber",   source = "athlete.licenseNumber")
    @Mapping(target = "gender",          source = "athlete.gender")
    @Mapping(target = "category",        expression = "java(r.getAthlete().getCategory() != null ? r.getAthlete().getCategory().name() : null)")
    @Mapping(target = "nationality",     source = "athlete.nationality")
    @Mapping(target = "clubId",          source = "athlete.club.id")
    @Mapping(target = "clubName",        source = "athlete.club.name")
    @Mapping(target = "rankPosition",    ignore = true)
    @Mapping(target = "medal",           ignore = true)
    ResultResponse toResponse(Result r);

    @Mapping(target = "competition", ignore = true)
    @Mapping(target = "event",       ignore = true)
    @Mapping(target = "athlete",     ignore = true)
    @Mapping(target = "disqualificationReason", ignore = true)
    @Mapping(target = "recordedBy",  ignore = true)
    @Mapping(target = "verifiedBy",  ignore = true)
    @Mapping(target = "verifiedAt",  ignore = true)
    @Mapping(target = "status", expression = "java(request.getStatus() != null ? request.getStatus().toUpperCase() : null)")
    Result toEntity(ResultRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "competition", ignore = true)
    @Mapping(target = "event",       ignore = true)
    @Mapping(target = "athlete",     ignore = true)
    @Mapping(target = "disqualificationReason", ignore = true)
    @Mapping(target = "recordedBy",  ignore = true)
    @Mapping(target = "verifiedBy",  ignore = true)
    @Mapping(target = "verifiedAt",  ignore = true)
    @Mapping(target = "status", expression = "java(request.getStatus() != null ? request.getStatus().toUpperCase() : result.getStatus())")
    void updateEntity(ResultRequest request, @MappingTarget Result result);
}
