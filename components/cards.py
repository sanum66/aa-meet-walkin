import streamlit as st


def metric_card(
    title,
    value,
    icon="📊",
    trend=""
):

    with st.container():

        st.markdown(
            f"""
            ### {icon} {title}

            <div style="
                font-size:38px;
                font-weight:700;
                color:#0F172A;
                margin-top:10px;
                margin-bottom:10px;
            ">
            {value}
            </div>

            <div style="
                color:#0F766E;
                font-weight:600;
                font-size:14px;
            ">
            {trend}
            </div>
            """,
            unsafe_allow_html=True
        )