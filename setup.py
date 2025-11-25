from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

# 从 pyproject.toml 中读取依赖信息，避免重复定义
setup(
    name="my-doge-macro",
    version="1.0.0",
    author="MY-DOGE Team",
    author_email="contact@example.com",
    description="基于 DeepSeek API 的量化宏观对冲策略工具",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/your-username/my-doge-macro",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Financial and Insurance Industry",
        "Topic :: Office/Business :: Financial :: Investment",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.8",
    # 移除 install_requires，使用 pyproject.toml 中的依赖定义
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "black>=22.0.0",
            "flake8>=5.0.0",
            "mypy>=1.0.0",
        ],
        "notebook": [
            "jupyter>=1.0.0",
            "matplotlib>=3.5.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "my-doge-macro=my_doge_macro.cli:main",
        ],
    },
    include_package_data=True,
    package_data={
        "my_doge_macro": ["py.typed"],
    },
)
