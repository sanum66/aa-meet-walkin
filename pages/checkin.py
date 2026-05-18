import io

import pandas as pd
import streamlit as st

from PIL import Image

from database import Database
from constants import MEMBERSHIP_OPTIONS
from utils import render_payment_section


def render_checkin_page(db: Database):

    st.header("Search & Check-In")

    attendees = db.get_all_attendees()

    if not attendees:

        st.warning("No attendees found.")

        return

    df = pd.DataFrame(attendees)

    # Filters
    col1, col2, col3 = st.columns(3)

    with col1:

        batch_options = ["All"]

        for year in range(1988, 2028):

            batch_options.append(str(year))

        selected_batch = st.selectbox(

            "Filter by Batch",

            batch_options

        )

    with col2:

        search_name = st.text_input(

            "Search by Name"

        )

    with col3:

        search_mobile = st.text_input(

            "Search by Mobile"

        )

    # Filter Data
    filtered_df = df.copy()

    if selected_batch != "All":

        filtered_df = filtered_df[

            filtered_df["batch_year"]
            .astype(str)
            == selected_batch

        ]

    if search_name.strip():

        filtered_df = filtered_df[

            filtered_df["name"]
            .astype(str)
            .str.lower()
            .str.contains(
                search_name.lower(),
                na=False
            )

        ]

    if search_mobile.strip():

        filtered_df = filtered_df[

            filtered_df["mobile"]
            .astype(str)
            .str.contains(
                search_mobile,
                na=False
            )

        ]

    # Results
    st.markdown("---")

    st.subheader(

        f"Results Found: {len(filtered_df)}"

    )

    if filtered_df.empty:

        st.warning(

            "Attendee not found."

        )

        st.info(

            "Please proceed with Walk-In Registration."

        )

        return

    # Display Results
    for _, attendee in filtered_df.iterrows():

        st.markdown("---")

        status = "Pending"

        if attendee["checked_in"]:

            status = "✅ Checked-In"

        col_left, col_right = st.columns([2, 2])

        # Left Panel
        with col_left:

            st.subheader(

                attendee["name"]

            )

            st.write(

                f"**Attendee ID:** "
                f"`{attendee['attendee_id']}`"

            )

            st.write(

                f"**Batch:** "
                f"{attendee['batch_year']}"

            )

            st.write(

                f"**Department:** "
                f"{attendee['stream']}"

            )

            updated_mobile = st.text_input(

                "Mobile",

                value=str(
                    attendee["mobile"]
                ),

                key=f"mobile_{attendee['attendee_id']}"

            )

            updated_email = st.text_input(

                "Email",

                value=str(
                    attendee["email"]
                ),

                key=f"email_{attendee['attendee_id']}"

            )

        # Right Panel
        with col_right:

            st.write(

                f"**Registration Type:** "
                f"{attendee['registration_type']}"

            )

            st.write(

                f"**Food Preference:** "
                f"{attendee['food_preference']}"

            )

            st.write(

                f"**Current Status:** "
                f"{status}"

            )

            # Payment Section
            st.markdown("---")

            payment_data = render_payment_section(
                MEMBERSHIP_OPTIONS,
                section_key=f"checkin_{attendee['attendee_id']}"
            )

            membership_amount = payment_data["membership_amount"]
            contribution_amount = payment_data["contribution_amount"]
            total_amount = payment_data["total_amount"]

        # Check-In Action
        st.markdown("---")

        if not attendee["checked_in"]:

            if st.button(

                f"✅ Check-In - {attendee['attendee_id']}",

                key=f"checkin_{attendee['attendee_id']}"

            ):

                db.update_attendee(

                    attendee["attendee_id"],

                    {

                        "mobile": updated_mobile,

                        "email": updated_email,

                        "amount_paid": total_amount,

                        "membership_amount": membership_amount,

                        "contribution_amount": contribution_amount,

                        "payment_status": "Paid",

                        "checked_in": True,

                    }

                )

                db.mark_checked_in(

                    attendee["attendee_id"]

                )

                st.success(

                    f"✅ {attendee['name']} checked in successfully."

                )

                st.rerun()

        else:

            st.success(

                "✅ Already Checked-In"

            )
