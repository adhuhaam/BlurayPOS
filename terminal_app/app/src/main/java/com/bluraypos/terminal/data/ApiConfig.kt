package com.bluraypos.terminal.data

import com.bluraypos.terminal.BuildConfig

object ApiConfig {
    const val PRODUCTION_URL = "https://api.bluraymaldives.site"

    val baseUrl: String
        get() = BuildConfig.API_URL.trimEnd('/')
}
