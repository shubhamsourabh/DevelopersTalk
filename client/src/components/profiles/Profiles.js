import React, { Fragment, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Spinner from "../layout/Spinner";
import ProfileItem from "./ProfileItem";
import { getProfiles } from "../../actions/profile";
//import SearchProfile from "./SearchProfile";

const Profiles = ({ getProfiles, profile: { profiles, loading } }) => {
	const [filteredProfile, setfilteredProfile] = useState(profiles);
	const [search, setSearch] = useState("");
	useEffect(() => {
		getProfiles();
		setfilteredProfile(
			profiles.filter((profile) => {
				return profile.user.name.toLowerCase().includes(search.toLowerCase());
			})
		);
	}, [getProfiles, search, profiles]);

	return (
		<Fragment>
			{loading ? (
				<Spinner />
			) : (
				<Fragment>
					<input
						type="text"
						placeholder="Search For Developers"
						onChange={(e) => setSearch(e.target.value)}
					/>
					<h1 className="large text-primary">Developers</h1>
					<p className="lead">
						<i className="fab fa-connectdevelop" /> Browse and connect with
						developers
					</p>
					<div className="profiles">
						{profiles.length > 0 ? (
							filteredProfile.map((profile) => (
								<ProfileItem key={profile._id} profile={profile} />
							))
						) : (
							<h4>No profiles found...</h4>
						)}
					</div>
				</Fragment>
			)}
		</Fragment>
	);
};

Profiles.propTypes = {
	getProfiles: PropTypes.func.isRequired,
	profile: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
	profile: state.profile,
});

export default connect(mapStateToProps, { getProfiles })(Profiles);
