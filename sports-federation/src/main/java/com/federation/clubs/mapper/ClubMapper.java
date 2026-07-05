package com.federation.clubs.mapper;

import com.federation.clubs.dto.ClubRequest;
import com.federation.clubs.dto.ClubResponse;
import com.federation.clubs.entity.Club;
import org.mapstruct.*;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ClubMapper {

    @Mapping(target = "managerId",   source = "manager.id")
    @Mapping(target = "managerName", expression = "java(club.getManager() != null ? club.getManager().getFullName() : null)")
    @Mapping(target = "activeAthletes", ignore = true)
    ClubResponse toResponse(Club club);

    @Mapping(target = "slug",      ignore = true)
    @Mapping(target = "manager",   ignore = true)
    @Mapping(target = "postalCode", ignore = true)
    Club toEntity(ClubRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "slug",      ignore = true)
    @Mapping(target = "manager",   ignore = true)
    @Mapping(target = "postalCode", ignore = true)
    void updateEntity(ClubRequest request, @MappingTarget Club club);
}
