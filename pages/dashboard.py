import streamlit as st
import pandas as pd

from utils import dataframe_from_records


# ---------------------------------------------------
# DASHBOARD
# ---------------------------------------------------

def render_dashboard_page(db):

    # ---------------------------------------------------
    # TITLE
    # ---------------------------------------------------

    st.markdown(

        """
        <div style="
            margin-bottom:28px;
        ">

            <div style="
                font-size:38px;
                font-weight:800;
                color:#0F172A;
            ">
                Dashboard
            </div>

            <div style="
                font-size:17px;
                color:#64748B;
                margin-top:8px;
            ">
                Real-time alumni meet overview
            </div>

        </div>
        """,

        unsafe_allow_html=True

    )

    # ---------------------------------------------------
    # FETCH DATA
    # ---------------------------------------------------

    attendees = db.get_all_attendees()

    df = dataframe_from_records(attendees)

    # ---------------------------------------------------
    # SAFE COUNTS
    # ---------------------------------------------------

    total_registrations = len(df)

    checked_in = 0

    total_collection = 0

    walkins = 0

    pre_registered = 0

    total_contribution = 0

    total_membership = 0

    if not df.empty:

        if "checked_in" in df.columns:

            checked_in = (
                df["checked_in"]
                .fillna(False)
                .astype(bool)
                .sum()
            )

        if "amount_paid" in df.columns:

            total_collection = (
                pd.to_numeric(
                    df["amount_paid"],
                    errors="coerce"
                )
                .fillna(0)
                .sum()
            )

        if "registration_type" in df.columns:

            walkins = len(

                df[
                    df["registration_type"]
                    ==
                    "Spot Registration"
                ]

            )

            pre_registered = len(

                df[
                    df["registration_type"]
                    ==
                    "Pre-Registered"
                ]

            )

        if "contribution_amount" in df.columns:

            total_contribution = (
                pd.to_numeric(
                    df["contribution_amount"],
                    errors="coerce"
                )
                .fillna(0)
                .sum()
            )

        if "membership_amount" in df.columns:

            total_membership = (
                pd.to_numeric(
                    df["membership_amount"],
                    errors="coerce"
                )
                .fillna(0)
                .sum()
            )

    # ---------------------------------------------------
    # KPI CARDS
    # ---------------------------------------------------

    cards = st.columns(4)

    metric_card(

        cards[0],

        "Total Registrations",

        total_registrations,

        "👥"

    )

    metric_card(

        cards[1],

        "Checked-In",

        checked_in,

        "✅"

    )

    metric_card(

        cards[2],

        "Walk-Ins",

        walkins,

        "📝"

    )

    metric_card(

        cards[3],

        "Total Collection",

        f"₹{total_collection:,.0f}",

        "💰"

    )

    st.markdown("<br>", unsafe_allow_html=True)

    # ---------------------------------------------------
    # SECOND ROW
    # ---------------------------------------------------

    cards2 = st.columns(3)

    metric_card(

        cards2[0],

        "Pre-Registered",

        pre_registered,

        "🎟️"

    )

    metric_card(

        cards2[1],

        "Contribution",

        f"₹{total_contribution:,.0f}",

        "🤝"

    )

    metric_card(

        cards2[2],

        "Membership",

        f"₹{total_membership:,.0f}",

        "🏅"

    )

    st.markdown("<br>", unsafe_allow_html=True)

    # ---------------------------------------------------
    # TABLE SECTION
    # ---------------------------------------------------

    left, right = st.columns([1.5, 1])

    # ---------------------------------------------------
    # RECENT REGISTRATIONS
    # ---------------------------------------------------

    with left:

        st.markdown(

            """
            <div class="metric-card">

                <div style="
                    font-size:24px;
                    font-weight:700;
                    margin-bottom:20px;
                    color:#0F172A;
                ">
                    Recent Registrations
                </div>

            """,

            unsafe_allow_html=True

        )

        if not df.empty:

            display_columns = [

                col for col in [

                    "name",
                    "mobile",
                    "batch_year",
                    "registration_type",
                    "amount_paid"

                ]

                if col in df.columns

            ]

            st.dataframe(

                df[display_columns]
                .tail(10),

                use_container_width=True,

                hide_index=True

            )

        else:

            st.info(
                "No registrations found."
            )

        st.markdown(
            "</div>",
            unsafe_allow_html=True
        )

    # ---------------------------------------------------
    # LIVE STATUS
    # ---------------------------------------------------

    with right:

        st.markdown(

            """
            <div class="metric-card">

                <div style="
                    font-size:24px;
                    font-weight:700;
                    margin-bottom:20px;
                    color:#0F172A;
                ">
                    Event Status
                </div>

            """,

            unsafe_allow_html=True

        )

        percentage = 0

        if total_registrations > 0:

            percentage = int(

                (
                    checked_in
                    /
                    total_registrations
                )
                * 100
            )

        st.progress(

            percentage / 100

        )

        st.markdown(

            f"""

            <div style="
                margin-top:18px;
                font-size:18px;
                font-weight:700;
                color:#1E293B;
            ">
                {percentage}% Checked-In
            </div>

            """,

            unsafe_allow_html=True

        )

        st.markdown("<br>", unsafe_allow_html=True)

        info_row(

            "Total Attendees",

            total_registrations

        )

        info_row(

            "Checked-In",

            checked_in

        )

        info_row(

            "Pending",

            total_registrations
            -
            checked_in

        )

        info_row(

            "Walk-Ins",

            walkins

        )

        st.markdown(
            "</div>",
            unsafe_allow_html=True
        )


# ---------------------------------------------------
# METRIC CARD
# ---------------------------------------------------

def metric_card(

    container,

    title,

    value,

    icon

):

    with container:

        st.markdown(

            f"""

            <div class="metric-card">

                <div style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    margin-bottom:16px;
                ">

                    <div style="
                        font-size:15px;
                        color:#64748B;
                        font-weight:600;
                    ">
                        {title}
                    </div>

                    <div style="
                        font-size:28px;
                    ">
                        {icon}
                    </div>

                </div>

                <div style="
                    font-size:34px;
                    font-weight:800;
                    color:#0F172A;
                ">
                    {value}
                </div>

            </div>

            """,

            unsafe_allow_html=True

        )


# ---------------------------------------------------
# INFO ROW
# ---------------------------------------------------

def info_row(label, value):

    st.markdown(

        f"""

        <div style="
            display:flex;
            justify-content:space-between;
            padding:12px 0;
            border-bottom:
                1px solid #E2E8F0;
        ">

            <div style="
                color:#64748B;
                font-weight:500;
            ">
                {label}
            </div>

            <div style="
                color:#0F172A;
                font-weight:700;
            ">
                {value}
            </div>

        </div>

        """,

        unsafe_allow_html=True

    )