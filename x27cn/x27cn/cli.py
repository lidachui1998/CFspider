"""
X27CN 命令行工具

用法:
    x27cn encrypt <file> [output] [--key=密钥]
    x27cn decrypt <file> [output] [--key=密钥]
    x27cn obfuscate <file> [output] [--key=密钥]
"""

import argparse
import sys
from .core import encrypt, decrypt, DEFAULT_KEY
from .obfuscate import obfuscate_file


def main():
    parser = argparse.ArgumentParser(
        prog='x27cn',
        description='X27CN 代码混淆加密工具'
    )
    parser.add_argument('--version', action='version', version='x27cn 1.0.0')
    
    subparsers = parser.add_subparsers(dest='command', help='命令')
    
    # encrypt 命令
    enc_parser = subparsers.add_parser('encrypt', help='加密文本或文件')
    enc_parser.add_argument('input', help='输入文件或文本')
    enc_parser.add_argument('output', nargs='?', help='输出文件（可选）')
    enc_parser.add_argument('--key', '-k', default=DEFAULT_KEY, help='加密密钥')
    enc_parser.add_argument('--text', '-t', action='store_true', help='将 input 作为文本而非文件')
    
    # decrypt 命令
    dec_parser = subparsers.add_parser('decrypt', help='解密文本或文件')
    dec_parser.add_argument('input', help='输入文件或加密文本')
    dec_parser.add_argument('output', nargs='?', help='输出文件（可选）')
    dec_parser.add_argument('--key', '-k', default=DEFAULT_KEY, help='解密密钥')
    dec_parser.add_argument('--text', '-t', action='store_true', help='将 input 作为文本而非文件')
    
    # obfuscate 命令
    obf_parser = subparsers.add_parser('obfuscate', help='混淆加密文件（生成自解密代码）')
    obf_parser.add_argument('input', help='输入文件 (.html/.js/.css)')
    obf_parser.add_argument('output', nargs='?', help='输出文件（可选）')
    obf_parser.add_argument('--key', '-k', default=DEFAULT_KEY, help='加密密钥')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(0)
    
    try:
        if args.command == 'encrypt':
            if args.text:
                result = encrypt(args.input, args.key)
                print(result)
            else:
                with open(args.input, 'r', encoding='utf-8') as f:
                    content = f.read()
                result = encrypt(content, args.key)
                if args.output:
                    with open(args.output, 'w', encoding='utf-8') as f:
                        f.write(result)
                    print(f'加密完成: {args.output}')
                else:
                    print(result)
        
        elif args.command == 'decrypt':
            if args.text:
                result = decrypt(args.input, args.key)
                print(result)
            else:
                with open(args.input, 'r', encoding='utf-8') as f:
                    content = f.read()
                result = decrypt(content, args.key)
                if args.output:
                    with open(args.output, 'w', encoding='utf-8') as f:
                        f.write(result)
                    print(f'解密完成: {args.output}')
                else:
                    print(result)
        
        elif args.command == 'obfuscate':
            output = obfuscate_file(args.input, args.output, args.key)
            print(f'混淆完成: {output}')
    
    except FileNotFoundError:
        print(f'错误: 文件不存在 - {args.input}', file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f'错误: {e}', file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()

